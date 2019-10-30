package com.macarron.chat.server.config.type;

import org.hibernate.internal.util.SerializationHelper;

import java.io.Serializable;

public class ObjectMapperJsonSerializer implements JsonSerializer {

    private final ObjectMapperWrapper objectMapperWrapper;

    public ObjectMapperJsonSerializer(ObjectMapperWrapper objectMapperWrapper) {
        this.objectMapperWrapper = objectMapperWrapper;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T clone(T value) {
        return (value instanceof Serializable) ?
                (T) SerializationHelper.clone((Serializable) value) :
                objectMapperWrapper.fromString(objectMapperWrapper.toString(value),
                        (Class<T>) value.getClass());
    }
}
