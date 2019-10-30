package com.macarron.chat.server.common.user;

import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.util.AvatarUtils;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerUserDTO {
    private long id;
    private String username;
    private int tag;
    private String avatar;

    public static ServerUserDTO fromModel(ServerUser user) {
        ServerUserDTO dto = new ServerUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setTag(user.getTag());
        dto.setAvatar(AvatarUtils.parseToBase64Png(user.getAvatar()));
        return dto;
    }
}
