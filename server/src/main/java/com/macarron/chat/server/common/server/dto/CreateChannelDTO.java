package com.macarron.chat.server.common.server.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;

@Getter
@Setter
public class CreateChannelDTO {
    @Min(1)
    private long serverId;
    @NotEmpty
    private String channelName;
}
