package com.macarron.chat.server.config.type;

public interface JsonSerializer {
    <T> T clone(T jsonObject);
}
