package com.macarron.chat.server.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
public class ChannelIdInterceptor implements HandshakeInterceptor {
    private static final String PARAM_CHANNEL_ID = "channelId";
    public static final String KEY_CHANNEL_ID = "KEY_CHANNEL_ID";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String channelIdStr = ((ServletServerHttpRequest) request).getServletRequest()
                .getParameter(PARAM_CHANNEL_ID);
        if (StringUtils.isEmpty(channelIdStr)) {
            log.warn("Given channel id param is empty");
            return false;
        }
        long channelId;
        try {
            channelId = Long.valueOf(channelIdStr);
        } catch (NumberFormatException e) {
            log.warn("Given channel id param {} is not valid", channelIdStr);
            return false;
        }
        attributes.put(KEY_CHANNEL_ID, channelId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
