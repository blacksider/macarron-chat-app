package com.macarron.chat.server.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.time.Instant;
import java.util.Map;

@Component
public class AuthTokenHandShakeInterceptor implements HandshakeInterceptor {
    private static final String HEADER_X_AUTH_TOKEN = "X-Auth-Token";
    public static final String KEY_SOCKET_SESSION = "KEY_SOCKET_SESSION";
    private SessionRepository sessionRepository;

    @Autowired
    public void setSessionRepository(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String token = ((ServletServerHttpRequest) request).getServletRequest()
                .getParameter(HEADER_X_AUTH_TOKEN.toLowerCase());
        Session session = sessionRepository.findById(token);
        if (session == null) {
            return false;
        }
        attributes.put(KEY_SOCKET_SESSION, session);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
