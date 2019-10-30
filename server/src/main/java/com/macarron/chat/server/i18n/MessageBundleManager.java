package com.macarron.chat.server.i18n;

import java.util.Locale;

public interface MessageBundleManager {
	String getMessage(String key);
	String getMessage(String key, Object[] args);
	String getMessage(String key, Object[] args, Locale locale);
}
