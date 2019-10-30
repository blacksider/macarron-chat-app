package com.macarron.chat.server.common.server.dto;

import com.macarron.chat.server.model.ChatServerUserGroup;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatServerUserGroupDTO {
    private long id;
    private String groupName;
    private List<ChatServerUserDTO> users;

    public static ChatServerUserGroupDTO fromModel(ChatServerUserGroup group) {
        ChatServerUserGroupDTO dto = new ChatServerUserGroupDTO();
        dto.setId(group.getId());
        dto.setGroupName(group.getGroupName());
        return dto;
    }
}
