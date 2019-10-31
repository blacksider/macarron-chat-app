package com.macarron.chat.server.common.message.vo;

import com.macarron.chat.server.common.message.MessageConstants;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageToServerChannel extends MessageTo {
    private static final long serialVersionUID = 5096306810422730769L;
    private long serverId;
    private long channelId;

    public MessageToServerChannel() {
        this.setType(MessageConstants.MessageToTypes.MESSAGE_TO_SERVER_CHANNEL);
    }
}
