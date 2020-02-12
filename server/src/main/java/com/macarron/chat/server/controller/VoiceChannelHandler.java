package com.macarron.chat.server.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.server.dto.ChatServerUserDTO;
import com.macarron.chat.server.config.AuthTokenHandShakeInterceptor;
import com.macarron.chat.server.config.ChannelIdInterceptor;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.repository.ServerUserRepository;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.session.Session;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Slf4j
@Component
public class VoiceChannelHandler extends BinaryWebSocketHandler {
    private final ObjectMapper om = new ObjectMapper();
    private final Map<Long, List<WebSocketSession>> sessionMap = new ConcurrentHashMap<>();
    private ServerUserRepository userRepository;
    private ChatServerUserRepository serverUserRepository;
    private UserSessionService userSessionService;
    private TransactionTemplate transactionTemplate;

    @Autowired
    public void setUserRepository(ServerUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setUserSessionService(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @Autowired
    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        long channelId = (long) session.getAttributes().get(ChannelIdInterceptor.KEY_CHANNEL_ID);
        sessionMap.computeIfAbsent(channelId, k -> new CopyOnWriteArrayList<>()).add(session);
//        sendServerUsersInChannel(channelId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        long channelId = (long) session.getAttributes().get(ChannelIdInterceptor.KEY_CHANNEL_ID);
        if (this.sessionMap.containsKey(channelId)) {
            this.sessionMap.get(channelId).remove(session);
        }
        if (this.sessionMap.get(channelId).isEmpty()) {
            this.sessionMap.remove(channelId);
        }
//        sendServerUsersInChannel(channelId);
    }

    private void sendServerUsersInChannel(long channelId) {
        List<WebSocketSession> inChannelSessions = this.sessionMap.get(channelId);

        List<ChatServerUserDTO> users = transactionTemplate.execute(status -> {
            List<String> allIdentifiers = inChannelSessions.stream()
                    .map(inChannelSession -> userSessionService.getSessionUser(inChannelSession).getUsername())
                    .collect(Collectors.toList());

            return getServerUsersByIdentifiers(allIdentifiers);
        });

        BinaryMessage serverUsersMessage = buildReplyServerUsersMessage(users);
        if (serverUsersMessage == null) {
            return;
        }
        for (WebSocketSession inChannelSession : inChannelSessions) {
            if (inChannelSession != null && inChannelSession.isOpen()) {
                try {
                    this.sendMessage(inChannelSession, serverUsersMessage);
                } catch (IOException e) {
                    log.error("Failed to send message", e);
                }
            }
        }
    }

    private void sendMessage(WebSocketSession session, BinaryMessage message) throws IOException {
        synchronized (session) {
            session.sendMessage(message);
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        // update session timeout
        Session httpSession = (Session) session.getAttributes().get(AuthTokenHandShakeInterceptor.KEY_SOCKET_SESSION);
        httpSession.setLastAccessedTime(Instant.now());

        int type = parseMessageType(message);
        long channelId = (long) session.getAttributes().get(ChannelIdInterceptor.KEY_CHANNEL_ID);
        switch (type) {
            case MessageConstants.VoiceMessageTypes.TYPE_GET_CHANNEL_PLAYERS: {
                parseGetChannels(session, channelId);
                break;
            }
            case MessageConstants.VoiceMessageTypes.TYPE_VOICE_MESSAGE: {
                if (this.sessionMap.containsKey(channelId)) {
                    for (WebSocketSession socketSession : this.sessionMap.get(channelId)) {
                        if (socketSession != null && socketSession != session && socketSession.isOpen()) {
                            try {
                                this.sendMessage(socketSession, message);
                            } catch (IOException e) {
                                log.error("Failed to send message", e);
                            }
                        }
                    }
                }
                break;
            }
        }
    }

    private void parseGetChannels(final WebSocketSession currentSession, long channelId) {
        transactionTemplate.execute(status -> {
            List<WebSocketSession> inChannelSessions = this.sessionMap.get(channelId);

            List<String> allIdentifiers = inChannelSessions.stream()
                    .map(session -> userSessionService.getSessionUser(session).getUsername())
                    .collect(Collectors.toList());

            List<ChatServerUserDTO> users = getServerUsersByIdentifiers(allIdentifiers);
            BinaryMessage serverUsersMessage = buildReplyServerUsersMessage(users);
            if (serverUsersMessage == null) {
                return status;
            }
            try {
                currentSession.sendMessage(serverUsersMessage);
            } catch (IOException e) {
                log.error("Failed to send message", e);
            }
            return status;
        });
    }

    private BinaryMessage buildReplyServerUsersMessage(final List<ChatServerUserDTO> users) {
        byte[] usersBytes;
        try {
            usersBytes = om.writeValueAsBytes(users);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse server users", e);
            return null;
        }
        // first 4 bytes is message type and then is the json serialized bytes value of server users
        ByteBuffer usersBuffer = ByteBuffer.allocate(4 + usersBytes.length)
                .putInt(MessageConstants.VoiceMessageTypes.TYPE_REPLY_CHANNEL_PLAYERS_CHANGE)
                .put(usersBytes);
        return new BinaryMessage(usersBuffer);
    }

    /**
     * first 4 bytes is a int, indicates the type of the message
     */
    private int parseMessageType(BinaryMessage message) {
        int type = message.getPayload().getInt();
        message.getPayload().rewind();
        return type;
    }

    private List<ChatServerUserDTO> getServerUsersByIdentifiers(final List<String> allIdentifiers) {
        List<ChatServerUser> serverUsers = serverUserRepository.findByUser_EmailIn(allIdentifiers);
        return serverUsers.stream().map(ChatServerUserDTO::fromModel)
                .collect(Collectors.toList());
    }
}
