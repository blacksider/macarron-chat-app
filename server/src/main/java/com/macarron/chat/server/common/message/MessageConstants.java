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

        public static final int TYPE_SERVER_INVITE = 3000;

        public static final int TYPE_ON_PASS_RTC_CONN = 4000;
        public static final int TYPE_ON_SCREEN_SHARE_REQUEST = 4100;
        public static final int TYPE_ON_SCREEN_SHARE_RESPONSE = 4101;

        public static final int TYPE_ON_PLAYER_JOIN_CHANNEL = 5000;
        public static final int TYPE_ON_PLAYER_LEFT_CHANNEL = 5001;

        public static final int TYPE_PLAYER_JOIN_CHANNEL = 5100;
        public static final int TYPE_PLAYER_LEFT_CHANNEL = 5101;
    }
}
