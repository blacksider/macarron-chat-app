package com.macarron.chat.server.common.message.vo;

import com.macarron.chat.server.common.message.MessageConstants;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageToUser extends MessageTo {
    private static final long serialVersionUID = -7927419095692233599L;
    private long userId;
    private String username;

    public MessageToUser() {
        this.setType(MessageConstants.MessageToTypes.MESSAGE_TO_USER);
    }
}
