package com.macarron.chat.server.config;

import com.macarron.chat.server.controller.UserMessageHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebsocketConfig implements WebSocketConfigurer {
    private UserMessageHandler userMessageHandler;
    private AuthTokenHandShakeInterceptor authTokenHandShakeInterceptor;

    @Autowired
    public void setUserMessageHandler(UserMessageHandler userMessageHandler) {
        this.userMessageHandler = userMessageHandler;
    }

    @Autowired
    public void setAuthTokenHandShakeInterceptor(AuthTokenHandShakeInterceptor authTokenHandShakeInterceptor) {
        this.authTokenHandShakeInterceptor = authTokenHandShakeInterceptor;
    }

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(Runtime.getRuntime().availableProcessors());
        taskScheduler.setRemoveOnCancelPolicy(true);
        return taskScheduler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(userMessageHandler, "/ws/connect")
                .addInterceptors(authTokenHandShakeInterceptor);
    }
}
