package com.macarron.chat.server.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;
import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.ServerChannelWrapDTO;
import com.macarron.chat.server.service.ChatServerChannelService;
import com.macarron.chat.server.service.ChatServerService;
import com.macarron.chat.server.service.UserMessageService;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class UserMessageServiceImpl implements UserMessageService {
    private final ObjectMapper om = new ObjectMapper();

    private UserSessionService userSessionService;
    private ChatServerService serverService;
    private ChatServerChannelService channelService;

    @Autowired
    public void setUserSessionService(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @Autowired
    public void setServerService(ChatServerService serverService) {
        this.serverService = serverService;
    }

    @Autowired
    public void setChannelService(ChatServerChannelService channelService) {
        this.channelService = channelService;
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
                break;
            }
            case MessageConstants.MessageTypes.TYPE_CHAT_TEXT: {
                try {
                    this.resolveChatTextMessage(session, messageData, message);
                } catch (IOException e) {
                    log.error("Unexpected error", e);
                }
                break;
            }
            default: {
                log.debug("Unknown message type {}", messageData.getMessageType());
                break;
            }
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
            messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVERS);
            sendMessage(session, messageData);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of server list", e);
        }
    }

    private void resolveChatTextMessage(WebSocketSession session, BiaMessage messageData, BinaryMessage message) throws IOException {
        for (WebSocketSession socketSession : userSessionService.getSessions()) {
            String userEmail = userSessionService.getSessionUser(socketSession).getUsername();
            log.info("Send to {}", userEmail);
            socketSession.sendMessage(message);
        }
    }

    @Override
    public void sendMessage(WebSocketSession session, BiaMessage messageData) {
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
}
