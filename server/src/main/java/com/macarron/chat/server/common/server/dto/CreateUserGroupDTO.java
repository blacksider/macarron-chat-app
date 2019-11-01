package com.macarron.chat.server.common.server.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserGroupDTO {
    private long serverId;
    private String groupName;
}
