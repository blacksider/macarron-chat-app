package com.macarron.chat.server.common.server.dto;

import com.macarron.chat.server.common.user.ServerUserDTO;
import com.macarron.chat.server.model.ChatServerUser;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatServerUserDTO {
    private long id;
    private ServerUserDTO user;
    private int userType;

    public static ChatServerUserDTO fromModel(ChatServerUser chatServerUser) {
        ChatServerUserDTO dto = new ChatServerUserDTO();
        dto.setId(chatServerUser.getId());
        dto.setUser(ServerUserDTO.fromModel(chatServerUser.getUser()));
        dto.setUserType(chatServerUser.getUserType());
        return dto;
    }
}
