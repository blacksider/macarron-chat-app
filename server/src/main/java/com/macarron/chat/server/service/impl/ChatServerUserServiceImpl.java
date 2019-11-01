package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.common.server.dto.ChatServerUserDTO;
import com.macarron.chat.server.common.server.dto.ChatServerUserGroupDTO;
import com.macarron.chat.server.common.server.dto.CreateUserGroupDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ChatServerUserGroup;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerUserGroupRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.repository.ServerUserRepository;
import com.macarron.chat.server.service.ChatServerUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatServerUserServiceImpl implements ChatServerUserService {
    private ChatServerUserGroupRepository serverUserGroupRepository;
    private ChatServerUserRepository serverUserRepository;
    private ServerUserRepository userRepository;

    @Autowired
    public void setServerUserGroupRepository(ChatServerUserGroupRepository serverUserGroupRepository) {
        this.serverUserGroupRepository = serverUserGroupRepository;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Autowired
    public void setUserRepository(ServerUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public List<ChatServerUserGroupDTO> getServerUserGroups(long serverId, String email) {
        Optional<ServerUser> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            // TODO
            throw new MessageException("error.credentials.invalid");
        }
        long count = serverUserRepository.countByUserEmailAndUserGroupServerId(email, serverId);
        if (count == 0) {
            // TODO
            throw new MessageException("error.credentials.invalid");
        }
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

    @Override
    public void createUserGroup(CreateUserGroupDTO req) {
        // TODO
    }

    @Override
    public void deleteUserGroup(long groupId) {
        // TODO
    }
}
