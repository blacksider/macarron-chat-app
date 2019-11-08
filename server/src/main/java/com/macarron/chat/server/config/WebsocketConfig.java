package com.macarron.chat.server.config;

import com.macarron.chat.server.controller.UserMessageHandler;
import com.macarron.chat.server.controller.VoiceChannelHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebsocketConfig implements WebSocketConfigurer {
    private UserMessageHandler userMessageHandler;
    private AuthTokenHandShakeInterceptor authTokenHandShakeInterceptor;
    private VoiceChannelHandler voiceChannelHandler;
    private ChannelIdInterceptor channelIdInterceptor;

    @Autowired
    public void setUserMessageHandler(UserMessageHandler userMessageHandler) {
        this.userMessageHandler = userMessageHandler;
    }

    @Autowired
    public void setAuthTokenHandShakeInterceptor(AuthTokenHandShakeInterceptor authTokenHandShakeInterceptor) {
        this.authTokenHandShakeInterceptor = authTokenHandShakeInterceptor;
    }

    @Autowired
    public void setVoiceChannelHandler(VoiceChannelHandler voiceChannelHandler) {
        this.voiceChannelHandler = voiceChannelHandler;
    }

    @Autowired
    public void setChannelIdInterceptor(ChannelIdInterceptor channelIdInterceptor) {
        this.channelIdInterceptor = channelIdInterceptor;
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
                .addInterceptors(authTokenHandShakeInterceptor)
                .setAllowedOrigins("*");
        registry.addHandler(voiceChannelHandler, "/ws/channel")
                .addInterceptors(authTokenHandShakeInterceptor, channelIdInterceptor)
                .setAllowedOrigins("*");
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(500000);
        container.setMaxBinaryMessageBufferSize(500000);
        return container;
    }
}
