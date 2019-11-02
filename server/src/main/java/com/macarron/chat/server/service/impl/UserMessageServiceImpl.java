package com.macarron.chat.server.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.message.vo.MessageToServerChannel;
import com.macarron.chat.server.common.message.vo.MessageToUser;
import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;
import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.ChatServerUserGroupDTO;
import com.macarron.chat.server.common.server.dto.ServerChannelWrapDTO;
import com.macarron.chat.server.common.server.dto.ServerUserGroupWrapDTO;
import com.macarron.chat.server.config.AuthTokenHandShakeInterceptor;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.service.ChatServerChannelService;
import com.macarron.chat.server.service.ChatServerService;
import com.macarron.chat.server.service.ChatServerUserService;
import com.macarron.chat.server.service.UserMessageService;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class UserMessageServiceImpl implements UserMessageService {
    private final ObjectMapper om = new ObjectMapper();

    private UserSessionService userSessionService;
    private ChatServerService serverService;
    private ChatServerUserRepository serverUserRepository;
    private ChatServerChannelService channelService;
    private ChatServerUserService serverUserService;
    private UserSessionService sessionService;

    @Autowired
    public void setUserSessionService(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @Autowired
    public void setServerService(ChatServerService serverService) {
        this.serverService = serverService;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Autowired
    public void setChannelService(ChatServerChannelService channelService) {
        this.channelService = channelService;
    }

    @Autowired
    public void setServerUserService(ChatServerUserService serverUserService) {
        this.serverUserService = serverUserService;
    }

    @Autowired
    public void setSessionService(UserSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    public void handleMessage(WebSocketSession session,
                              BiaMessage messageData,
                              BinaryMessage message) {
        switch (messageData.getMessageType()) {
            case MessageConstants.MessageTypes.TYPE_GET_SERVERS: {
                this.resolveGetServers(session, messageData);
                break;
            }
            case MessageConstants.MessageTypes.TYPE_GET_SERVER_CHANNELS: {
                this.resolveGetServerChannels(session, messageData);
                break;
            }
            case MessageConstants.MessageTypes.TYPE_GET_SERVER_USER_GROUP: {
                this.resolveGetServerUserGroup(session, messageData);
                break;
            }
            case MessageConstants.MessageTypes.TYPE_CHAT_TEXT: {
                this.resolveChatTextMessage(session, messageData);
                break;
            }
            default: {
                log.debug("Unknown message type {}", messageData.getMessageType());
                break;
            }
        }
    }

    private void resolveGetServerUserGroup(WebSocketSession session, BiaMessage messageData) {
        String userEmail = userSessionService.getSessionUser(session).getUsername();
        long serverId = Long.parseLong(new String(messageData.getMessage()));
        List<ChatServerUserGroupDTO> userGroups = this.serverUserService.getServerUserGroups(serverId, userEmail);
        ServerUserGroupWrapDTO data = new ServerUserGroupWrapDTO(serverId, userGroups);
        try {
            byte[] messageBytes = om.writeValueAsString(data).getBytes();
            messageData.setMessage(messageBytes);
            messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
            messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVER_USER_GROUP);
            sendMessage(session, messageData);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of user group list", e);
        }
    }

    private void resolveGetServerChannels(WebSocketSession session, BiaMessage messageData) {
        String userEmail = userSessionService.getSessionUser(session).getUsername();
        long serverId = Long.parseLong(new String(messageData.getMessage()));
        List<ChatServerChannelDTO> channels = channelService.getServerChannels(serverId, userEmail);
        ServerChannelWrapDTO data = new ServerChannelWrapDTO(serverId, channels);
        try {
            byte[] messageBytes = om.writeValueAsString(data).getBytes();
            messageData.setMessage(messageBytes);
            messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
            messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVER_CHANNELS);
            sendMessage(session, messageData);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of channel list", e);
        }
    }

    private void resolveGetServers(WebSocketSession session, BiaMessage messageData) {
        String userEmail = userSessionService.getSessionUser(session).getUsername();
        List<ChatServerDTO> servers = serverService.getServers(userEmail);
        try {
            byte[] serversBytes = om.writeValueAsString(servers).getBytes();
            messageData.setMessage(serversBytes);
            messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
            messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVERS);
            sendMessage(session, messageData);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of server list", e);
        }
    }

    private void resolveChatTextMessage(WebSocketSession session, BiaMessage messageData) {
        if (MessageConstants.MessageToTypes.MESSAGE_TO_SERVER_CHANNEL.equals(messageData.getMessageTo().getType())) {
            Assert.isTrue(messageData.getMessageTo() instanceof MessageToServerChannel,
                    "Invalid data of type " + messageData.getMessageTo().getType());
            MessageToServerChannel toChannel = (MessageToServerChannel) messageData.getMessageTo();
            List<String> userEmails = serverUserRepository.getUserEmailsByServerId(toChannel.getServerId());
            for (WebSocketSession socketSession : userSessionService.getSessions()) {
                String userEmail = userSessionService.getSessionUser(socketSession).getUsername();
                if (userEmails.contains(userEmail)) {
                    log.info("Send to {}", userEmail);
                    sendMessage(socketSession, messageData);
                }
            }
        }
    }

    @Override
    public void sendMessage(WebSocketSession session, BiaMessage messageData) {
        // update session timeout
        Session httpSession = (Session) session.getAttributes().get(AuthTokenHandShakeInterceptor.KEY_SOCKET_SESSION);
        httpSession.setLastAccessedTime(Instant.now());

        log.info("Write to {}", session.getId());
        try {
            byte[] dataBytes = om.writeValueAsString(messageData).getBytes();
            log.info("write bytes: {}", Arrays.toString(dataBytes));
            session.sendMessage(new BinaryMessage(dataBytes));
        } catch (JsonProcessingException e) {
            log.error("Failed to parse message data", e);
        } catch (IOException e) {
            log.error("Failed to send data of server list", e);
        }
    }

    @Override
    public void sendMessageBelongsTO(BiaMessage messageData, Map<String, ServerUser> emails) {
        for (WebSocketSession socketSession : sessionService.getSessions()) {
            String userEmail = sessionService.getSessionUser(socketSession).getUsername();
            if (emails.containsKey(userEmail)) {
                ServerUser emailMappedUser = emails.get(userEmail);

                MessageToUser toUser = new MessageToUser();
                toUser.setUserId(emailMappedUser.getId());
                toUser.setUsername(emailMappedUser.getUsername());
                messageData.setMessageTo(toUser);

                sendMessage(socketSession, messageData);
            }
        }
    }
}
