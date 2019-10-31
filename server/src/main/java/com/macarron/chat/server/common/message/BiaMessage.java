package com.macarron.chat.server.common.message;

import com.macarron.chat.server.common.message.vo.MessageFrom;
import com.macarron.chat.server.common.message.vo.MessageTo;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BiaMessage {
    private MessageFrom messageFrom;
    private MessageTo messageTo;
    private int messageType;
    private byte[] message;
}
