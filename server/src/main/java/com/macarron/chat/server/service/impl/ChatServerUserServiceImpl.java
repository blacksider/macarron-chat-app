package com.macarron.chat.server.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.message.MessageBuilder;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.message.vo.MessageFromUser;
import com.macarron.chat.server.common.server.ServerConstants;
import com.macarron.chat.server.common.server.dto.ChatServerUserDTO;
import com.macarron.chat.server.common.server.dto.ChatServerUserGroupDTO;
import com.macarron.chat.server.common.server.dto.CreateUserGroupDTO;
import com.macarron.chat.server.common.server.dto.ServerUserGroupWrapDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ChatServerUserGroup;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerUserGroupRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.service.ChatServerService;
import com.macarron.chat.server.service.ChatServerUserService;
import com.macarron.chat.server.service.UserMessageService;
import com.macarron.chat.server.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatServerUserServiceImpl implements ChatServerUserService {
    private final ObjectMapper om = new ObjectMapper();
    private ChatServerUserGroupRepository serverUserGroupRepository;
    private ChatServerUserRepository serverUserRepository;
    private ChatServerService serverService;
    private UserService userService;
    private UserMessageService messageService;
    private TransactionTemplate transactionTemplate;

    @Autowired
    public void setServerUserGroupRepository(ChatServerUserGroupRepository serverUserGroupRepository) {
        this.serverUserGroupRepository = serverUserGroupRepository;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Autowired
    public void setServerService(ChatServerService serverService) {
        this.serverService = serverService;
    }

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }

    @Autowired
    public void setMessageService(UserMessageService messageService) {
        this.messageService = messageService;
    }

    @Autowired
    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    @Transactional
    public List<ChatServerUserGroupDTO> getServerUserGroups(long serverId, String email) {
        serverService.validateServerUser(serverId, email);
        return getServerUserGroups(serverId);
    }

    private List<ChatServerUserGroupDTO> getServerUserGroups(long serverId) {
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
        ServerUser user = userService.getCurrentUser();
        if (user == null) {
            throw new MessageException("error.credentials.invalid");
        }
        ChatServer changedServer = transactionTemplate.execute(status -> {
            ChatServerUser serverUser = serverUserRepository.getUserByServerId(req.getServerId(), user);
            if (serverUser == null || serverUser.getUserType() != ServerConstants.SERVER_USER_OWNER) {
                throw new MessageException("error.credentials.invalid");
            }
            ChatServer server = serverUser.getUserGroup().getServer();

            boolean exists = serverUserGroupRepository.existsByServerAndGroupName(server, req.getGroupName());
            if (exists) {
                throw new MessageException("error.user.group.name.exists");
            }

            ChatServerUserGroup newGroup = new ChatServerUserGroup();

            newGroup.setGroupName(req.getGroupName());
            newGroup.setServer(server);
            serverUserGroupRepository.save(newGroup);

            return server;
        });
        // notify all user belong to this server
        notifyUserGroupChanges(changedServer);
    }

    private void notifyUserGroupChanges(ServerUser currentUser, ChatServer server, List<ServerUser> serverUsers) {
        Map<String, ServerUser> emails = serverUsers.stream()
                .collect(Collectors.toMap(ServerUser::getEmail, Function.identity()));

        BiaMessage messageData = new BiaMessage();
        messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
        messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVER_USER_GROUP);
        MessageFromUser fromUser = MessageBuilder.buildFromUser(currentUser);
        messageData.setMessageFrom(fromUser);
        List<ChatServerUserGroupDTO> userGroups = getServerUserGroups(server.getId());
        ServerUserGroupWrapDTO data = new ServerUserGroupWrapDTO(server.getId(), userGroups);
        try {
            byte[] messageBytes = om.writeValueAsString(data).getBytes();
            messageData.setMessage(messageBytes);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of user group list", e);
            return;
        }
        messageService.sendMessageBelongsTO(messageData, emails);
    }

    @Transactional
    public void notifyUserGroupChanges(ChatServer server) {
        ServerUser currentUser = userService.getCurrentUser();
        List<ServerUser> serverUsers = serverUserRepository.getServerUsers(server);
        notifyUserGroupChanges(currentUser, server, serverUsers);
    }

    @Override
    public void deleteUserGroup(long groupId) {
        ServerUser currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            throw new MessageException("error.credentials.invalid");
        }
        Pair<ChatServer, List<ServerUser>> res = this.transactionTemplate.execute(status -> {
            Optional<ChatServerUserGroup> groupOpt = serverUserGroupRepository.findById(groupId);
            if (!groupOpt.isPresent()) {
                throw new MessageException("error.credentials.invalid");
            }
            ChatServerUserGroup userGroup = groupOpt.get();
            ChatServerUser serverUser = serverService.validateUserIsOwnerAndGet(userGroup.getServer().getId(), currentUser);
            if (serverUser == null) {
                throw new MessageException("error.credentials.invalid");
            }
            ChatServer server = userGroup.getServer();
            long channelCount = serverUserGroupRepository.countByServer(server);
            if (channelCount == 1) {
                throw new MessageException("error.user.group.last");
            }

            List<ServerUser> serverUserList = serverUserRepository.getServerUsers(server);

            serverUserGroupRepository.deleteById(userGroup.getId());

            return Pair.of(server, serverUserList);
        });
        if (res != null) {
            notifyUserGroupChanges(currentUser, res.getFirst(), res.getSecond());
        }
    }
}
