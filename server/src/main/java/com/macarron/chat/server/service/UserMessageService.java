package com.macarron.chat.server.service;

import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.model.ServerUser;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;

public interface UserMessageService {
    void handleMessage(WebSocketSession session, BiaMessage messageData, BinaryMessage message);

    void sendMessage(WebSocketSession socketSession, BiaMessage messageData);

    void sendMessageBelongsTO(final BiaMessage messageData, final Map<String, ServerUser> emails);
}
