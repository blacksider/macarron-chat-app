package com.macarron.chat.server.common.message;

public class MessageConstants {
    // message from types
    public static class MessageFromTypes {
        public static final String MESSAGE_FROM_USER = "USER";
    }

    // message to types
    public static class MessageToTypes {
        public static final String MESSAGE_TO_USER = "USER";
        public static final String MESSAGE_TO_SERVER_CHANNEL = "SERVER_CHANNEL";
    }

    // message types
    public static class MessageTypes {
        public static final int TYPE_CHAT_TEXT = 1000;
        public static final int TYPE_CHAT_IMG = 1001;

        public static final int TYPE_GET_SERVERS = 2000;
        public static final int TYPE_REPLY_SERVERS = 2001;
        public static final int TYPE_GET_SERVER_CHANNELS = 2010;
        public static final int TYPE_REPLY_SERVER_CHANNELS = 2011;
        public static final int TYPE_GET_SERVER_USER_GROUP = 2020;
        public static final int TYPE_REPLY_SERVER_USER_GROUP = 2021;
    }
}
