package com.macarron.chat.server.common.server.dto;

import com.macarron.chat.server.common.user.ServerUserDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ServerChannelWrapDTO {
    private long serverId;
    private List<ChatServerChannelDTO> channels;
    private Map<Long, List<ServerUserDTO>> channelUsers;

    public ServerChannelWrapDTO(long serverId, List<ChatServerChannelDTO> channels) {
        this.serverId = serverId;
        this.channels = channels;
    }
}
