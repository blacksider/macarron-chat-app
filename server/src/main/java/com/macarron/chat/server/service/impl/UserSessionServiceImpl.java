package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.config.AuthTokenHandShakeInterceptor;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.userdetails.User;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class UserSessionServiceImpl implements UserSessionService {
    private static final String SPRING_SECURITY_CONTEXT = "SPRING_SECURITY_CONTEXT";
    private List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void addSession(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void removeSession(WebSocketSession session) {
        this.sessions.remove(session);
    }

    @Override
    public List<WebSocketSession> getSessions() {
        return sessions;
    }

    @Override
    public User getSessionUser(WebSocketSession session) {
        Session httpSession = (Session) session.getAttributes().get(AuthTokenHandShakeInterceptor.KEY_SOCKET_SESSION);
        SecurityContext context = httpSession.getAttribute(SPRING_SECURITY_CONTEXT);
        return (User) context.getAuthentication().getPrincipal();
    }

    @Override
    public WebSocketSession getSessionByIdentifier(String identifier) {
        for (WebSocketSession session : sessions) {
            User user = getSessionUser(session);
            if (user.getUsername().equals(identifier)) {
                return session;
            }
        }
        return null;
    }
}
