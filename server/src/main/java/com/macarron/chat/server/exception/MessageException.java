package com.macarron.chat.server.exception;

public class MessageException extends RuntimeException {
    private static final long serialVersionUID = -4957756838439070644L;

    private String key;
    private Object[] args;
    private Object detail;

    public MessageException(String key) {
        super(key);
        this.key = key;
    }

    public MessageException(String key, Object[] args) {
        super(key);
        this.key = key;
        this.args = args;
    }

    public MessageException(String key, Object detail) {
        this(key);
        this.detail = detail;
    }

    public MessageException(String key, Object[] args, Object detail) {
        this(key, args);
        this.detail = detail;
    }

    public String getKey() {
        return key;
    }

    public Object[] getArgs() {
        return args;
    }

    public Object getDetail() {
        return detail;
    }
}
