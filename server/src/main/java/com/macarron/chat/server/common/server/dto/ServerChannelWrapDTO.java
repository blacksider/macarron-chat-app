package com.macarron.chat.server.common.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ServerChannelWrapDTO {
    private long serverId;
    private List<ChatServerChannelDTO> channels;
}
