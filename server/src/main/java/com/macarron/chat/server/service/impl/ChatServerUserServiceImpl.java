package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.common.server.dto.ChatServerUserDTO;
import com.macarron.chat.server.common.server.dto.ChatServerUserGroupDTO;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ChatServerUserGroup;
import com.macarron.chat.server.repository.ChatServerUserGroupRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.service.ChatServerUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatServerUserServiceImpl implements ChatServerUserService {
    private ChatServerUserGroupRepository serverUserGroupRepository;
    private ChatServerUserRepository serverUserRepository;

    @Autowired
    public void setServerUserGroupRepository(ChatServerUserGroupRepository serverUserGroupRepository) {
        this.serverUserGroupRepository = serverUserGroupRepository;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Override
    @Transactional
    public List<ChatServerUserGroupDTO> getServerUserGroups(long serverId) {
        List<ChatServerUserGroup> groups = serverUserGroupRepository.findByServer_Id(serverId);
        return groups.stream()
                .map(group -> {
                    ChatServerUserGroupDTO dto = ChatServerUserGroupDTO.fromModel(group);
                    List<ChatServerUser> users = serverUserRepository.findByUserGroup(group);
                    dto.setUsers(users.stream()
                            .map(ChatServerUserDTO::fromModel)
                            .collect(Collectors.toList()));
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
