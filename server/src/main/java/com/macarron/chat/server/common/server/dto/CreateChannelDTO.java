package com.macarron.chat.server.common.server.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateChannelDTO {
    private long serverId;
    private String channelName;
}
