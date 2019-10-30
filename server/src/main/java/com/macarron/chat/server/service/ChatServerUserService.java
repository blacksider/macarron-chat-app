package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerUserGroupDTO;

import java.util.List;

public interface ChatServerUserService {
    List<ChatServerUserGroupDTO> getServerUserGroups(long serverId);
}
