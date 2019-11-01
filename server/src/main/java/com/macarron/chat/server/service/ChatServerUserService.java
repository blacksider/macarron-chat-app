package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerUserGroupDTO;
import com.macarron.chat.server.common.server.dto.CreateUserGroupDTO;

import java.util.List;

public interface ChatServerUserService {
    List<ChatServerUserGroupDTO> getServerUserGroups(long serverId, String email);

    void createUserGroup(final CreateUserGroupDTO req);

    void deleteUserGroup(long groupId);
}
