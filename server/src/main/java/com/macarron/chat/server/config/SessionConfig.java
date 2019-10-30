package com.macarron.chat.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.session.data.redis.config.annotation.web.http.RedisHttpSessionConfiguration;
import org.springframework.session.web.http.HeaderHttpSessionIdResolver;
import org.springframework.session.web.http.HttpSessionIdResolver;

import javax.annotation.PostConstruct;

@Configuration
public class SessionConfig extends RedisHttpSessionConfiguration {
    private static final String DEFAULT_NAMESPACE = RedisIndexedSessionRepository.DEFAULT_NAMESPACE;

    @Value("${spring.session.timeout}")
    private Integer maxInactiveIntervalInSeconds;

    @Bean
    public HttpSessionIdResolver httpSessionIdResolver() {
        return HeaderHttpSessionIdResolver.xAuthToken();
    }

    @PostConstruct
    public void initConfig() {
        this.setMaxInactiveIntervalInSeconds(this.maxInactiveIntervalInSeconds);
        this.setRedisNamespace(DEFAULT_NAMESPACE);
    }
}
