package com.macarron.chat.server.common.server.dto;

import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.util.AvatarUtils;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatServerDTO {
    private long id;
    private String serverName;
    private String avatar;

    public static ChatServerDTO fromModel(ChatServer server) {
        ChatServerDTO dto = new ChatServerDTO();
        dto.setId(server.getId());
        dto.setServerName(server.getServerName());
        dto.setAvatar(AvatarUtils.parseToBase64Png(server.getAvatar()));
        return dto;
    }
}
