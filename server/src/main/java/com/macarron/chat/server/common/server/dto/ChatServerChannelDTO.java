package com.macarron.chat.server.common.server.dto;

import com.macarron.chat.server.model.ChatServerChannel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatServerChannelDTO {
    private long id;
    private String channelName;

    public static ChatServerChannelDTO fromModel(ChatServerChannel channel) {
        ChatServerChannelDTO dto = new ChatServerChannelDTO();
        dto.setId(channel.getId());
        dto.setChannelName(channel.getChannelName());
        return dto;
    }
}
