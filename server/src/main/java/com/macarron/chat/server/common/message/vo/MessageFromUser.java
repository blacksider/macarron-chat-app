package com.macarron.chat.server.common.message.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageFromUser extends MessageFrom {
    private static final long serialVersionUID = 6239995808144531936L;
    private long userId;
    private String username;
}
