package com.macarron.chat.server.service;

import com.macarron.chat.server.common.message.BiaMessage;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;

public interface UserMessageService {
    void handleMessage(WebSocketSession session, BiaMessage messageData, BinaryMessage message);

    void sendMessage(WebSocketSession socketSession, BiaMessage messageData);
}
