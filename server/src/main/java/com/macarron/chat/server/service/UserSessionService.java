package com.macarron.chat.server.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;

public interface UserSessionService {
    void addSession(WebSocketSession session);

    void removeSession(WebSocketSession session);

    List<WebSocketSession> getSessions();

    User getSessionUser(WebSocketSession socketSession);
}
