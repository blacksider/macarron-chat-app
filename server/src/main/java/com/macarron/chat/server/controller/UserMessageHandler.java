package com.macarron.chat.server.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.config.AuthTokenHandShakeInterceptor;
import com.macarron.chat.server.service.PlayerToChannelService;
import com.macarron.chat.server.service.UserMessageService;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.session.Session;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Component
public class UserMessageHandler extends BinaryWebSocketHandler {
    private final ObjectMapper om = new ObjectMapper();

    private UserMessageService userMessageService;
    private UserSessionService userSessionService;
    private PlayerToChannelService playerToChannelService;

    @Autowired
    public void setUserMessageService(UserMessageService userMessageService) {
        this.userMessageService = userMessageService;
    }

    @Autowired
    public void setUserSessionService(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }

    @Autowired
    public void setPlayerToChannelService(PlayerToChannelService playerToChannelService) {
        this.playerToChannelService = playerToChannelService;
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        // update session timeout
        Session httpSession = (Session) session.getAttributes().get(AuthTokenHandShakeInterceptor.KEY_SOCKET_SESSION);
        httpSession.setLastAccessedTime(Instant.now());

        log.info("Read from {}", session.getId());
        BiaMessage messageData = readyMessage(message);
        if (messageData == null) {
            log.debug("Message is empty, skip");
            return;
        }

        try {
            this.userMessageService.handleMessage(session, messageData, message);
        } catch (Exception e) {
            log.error("Failed to handle message", e);
        }
    }

    private BiaMessage readyMessage(BinaryMessage message) {
        try {
            return om.readValue(message.getPayload().array(), BiaMessage.class);
        } catch (IOException e) {
            log.error("Failed to read message", e);
        }
        return null;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        this.userSessionService.addSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        try {
            this.playerToChannelService.handlePlayerCloseConnection(session);
        } catch (Exception e) {
            log.error("handle close connection error", e);
        }
        this.userSessionService.removeSession(session);
    }
}
