package com.macarron.chat.server.i18n;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class MessageBundleManagerImpl implements MessageBundleManager {
    private ApplicationContext context;

    @Autowired
    public void setContext(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public String getMessage(String key) {
        return getMessage(key, null);
    }

    @Override
    public String getMessage(String key, Object[] args) {
        return getMessage(key, args, Locale.SIMPLIFIED_CHINESE);
    }

    @Override
    public String getMessage(String key, Object[] args, Locale locale) {
        return context.getMessage(key, args, locale);
    }
}
