package com.macarron.chat.server.config.type;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public final class ReflectionUtils {
    public static final String GETTER_PREFIX = "get";
    private static final Logger LOGGER = LoggerFactory.getLogger(ReflectionUtils.class);

    private ReflectionUtils() {
        throw new UnsupportedOperationException("ReflectionUtils is not instantiable!");
    }

    public static Method getMethod(Object target, String methodName, Class... parameterTypes) {
        return getMethod(target.getClass(), methodName, parameterTypes);
    }

    @SuppressWarnings("unchecked")
    public static Method getMethod(Class targetClass, String methodName, Class... parameterTypes) {
        try {
            return targetClass.getDeclaredMethod(methodName, parameterTypes);
        } catch (NoSuchMethodException e) {
            try {
                return targetClass.getMethod(methodName, parameterTypes);
            } catch (NoSuchMethodException ignore) {
            }

            if (!targetClass.getSuperclass().equals(Object.class)) {
                return getMethod(targetClass.getSuperclass(), methodName, parameterTypes);
            } else {
                throw handleException(methodName, e);
            }
        }
    }

    public static Method getGetter(Object target, String property) {
        String getterMethodName = GETTER_PREFIX + property.substring(0, 1).toUpperCase() + property.substring(1);
        Method getter = getMethod(target, getterMethodName);
        getter.setAccessible(true);
        return getter;
    }

    @SuppressWarnings("unchecked")
    public static <T> T invokeGetter(Object target, String property) {
        Method setter = getGetter(target, property);
        try {
            return (T) setter.invoke(target);
        } catch (IllegalAccessException e) {
            throw handleException(setter.getName(), e);
        } catch (InvocationTargetException e) {
            throw handleException(setter.getName(), e);
        }
    }

    private static IllegalArgumentException handleException(String methodName, NoSuchMethodException e) {
        LOGGER.error("Couldn't find method " + methodName, e);
        return new IllegalArgumentException(e);
    }

    private static IllegalArgumentException handleException(String memberName, IllegalAccessException e) {
        LOGGER.error("Couldn't access member " + memberName, e);
        return new IllegalArgumentException(e);
    }

    private static IllegalArgumentException handleException(String methodName, InvocationTargetException e) {
        LOGGER.error("Couldn't invoke method " + methodName, e);
        return new IllegalArgumentException(e);
    }
}
