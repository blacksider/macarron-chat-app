package com.macarron.chat.server.common.message;

import com.macarron.chat.server.common.message.vo.MessageFromUser;
import com.macarron.chat.server.model.ServerUser;

public class MessageBuilder {
    public static MessageFromUser buildFromUser(ServerUser user) {
        MessageFromUser fromUser = new MessageFromUser();
        fromUser.setUserId(user.getId());
        fromUser.setUsername(user.getUsername());
        return fromUser;
    }
}
