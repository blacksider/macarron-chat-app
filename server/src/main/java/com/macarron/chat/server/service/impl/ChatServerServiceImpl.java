package com.macarron.chat.server.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.message.MessageBuilder;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.message.vo.MessageFromUser;
import com.macarron.chat.server.common.message.vo.MessageToUser;
import com.macarron.chat.server.common.server.ServerConstants;
import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;
import com.macarron.chat.server.common.server.dto.InviteToServerWrapDTO;
import com.macarron.chat.server.common.server.dto.InviteUserDTO;
import com.macarron.chat.server.common.server.dto.ResolveServerInviteDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.i18n.MessageBundleManager;
import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerChannel;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ChatServerUserGroup;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerChannelRepository;
import com.macarron.chat.server.repository.ChatServerRepository;
import com.macarron.chat.server.repository.ChatServerUserGroupRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.repository.ServerUserRepository;
import com.macarron.chat.server.service.ChatServerService;
import com.macarron.chat.server.service.ChatServerUserService;
import com.macarron.chat.server.service.UserMessageService;
import com.macarron.chat.server.service.UserService;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.FileCopyUtils;
import org.springframework.util.ResourceUtils;
import org.springframework.web.socket.WebSocketSession;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatServerServiceImpl implements ChatServerService {
    private static final String AVATAR_DEFAULT = "classpath:avatar/server_default.png";
    private static final String INVITE_USER_KEY = "SERVER_INVITE_USER";
    private byte[] bufferedDefaultAvatar;
    private final ObjectMapper om = new ObjectMapper();

    private UserService userService;
    private MessageBundleManager bundleManager;
    private ChatServerRepository chatServerRepository;
    private ChatServerChannelRepository serverChannelRepository;
    private ChatServerUserGroupRepository serverUserGroupRepository;
    private ChatServerUserRepository serverUserRepository;
    private ServerUserRepository userRepository;
    private UserSessionService sessionService;
    private UserMessageService messageService;
    private TransactionTemplate transactionTemplate;
    private RedisTemplate<String, Object> redisTemplate;
    private ChatServerUserService serverUserService;

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }

    @Autowired
    public void setBundleManager(MessageBundleManager bundleManager) {
        this.bundleManager = bundleManager;
    }

    @Autowired
    public void setChatServerRepository(ChatServerRepository chatServerRepository) {
        this.chatServerRepository = chatServerRepository;
    }

    @Autowired
    public void setServerChannelRepository(ChatServerChannelRepository serverChannelRepository) {
        this.serverChannelRepository = serverChannelRepository;
    }

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

    @Autowired
    public void setSessionService(UserSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Autowired
    public void setMessageService(UserMessageService messageService) {
        this.messageService = messageService;
    }

    @Autowired
    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    @Autowired
    public void setRedisTemplate(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Autowired
    public void setServerUserService(ChatServerUserService serverUserService) {
        this.serverUserService = serverUserService;
    }

    private byte[] getDefaultAvatar() {
        if (bufferedDefaultAvatar != null) {
            return bufferedDefaultAvatar;
        }
        try {
            File defaultAvatarImg = ResourceUtils.getFile(AVATAR_DEFAULT);
            this.bufferedDefaultAvatar = FileCopyUtils.copyToByteArray(defaultAvatarImg);
            return bufferedDefaultAvatar;
        } catch (FileNotFoundException e) {
            log.error("Failed to find default server avatar image", e);
            throw new MessageException("error.unknown");
        } catch (IOException e) {
            log.error("Failed to read default server avatar image", e);
            throw new MessageException("error.unknown");
        }
    }

    @Override
    public void createServer(CreateServerReqDTO req) {
        ChatServer server = this.transactionTemplate.execute(status -> {
            ServerUser user = userService.getCurrentUser();
            if (user == null) {
                throw new MessageException("error.credentials.invalid");
            }

            ChatServer newServer = new ChatServer();
            newServer.setServerName(req.getName());
            newServer.setCreateTime(Instant.now());
            newServer.setUpdateTime(Instant.now());
            newServer.setAvatar(getDefaultAvatar());
            chatServerRepository.save(newServer);

            ChatServerChannel defaultChannel = getDefaultChannelData(newServer);
            serverChannelRepository.save(defaultChannel);

            ChatServerUserGroup defaultGroup = getDefaultGroupData(newServer);
            serverUserGroupRepository.save(defaultGroup);

            ChatServerUser serverUser = new ChatServerUser();
            serverUser.setUserType(ServerConstants.SERVER_USER_OWNER);
            serverUser.setUser(user);
            serverUser.setUserGroup(defaultGroup);
            serverUserRepository.save(serverUser);

            return newServer;
        });
        if (server != null) {
            notifyServerChanges(server);
        }
    }

    private ChatServerChannel getDefaultChannelData(ChatServer server) {
        String channelName = this.bundleManager.getMessage("server.channel.default");
        ChatServerChannel defaultChannel = new ChatServerChannel();
        defaultChannel.setChannelName(channelName);
        defaultChannel.setServer(server);
        return defaultChannel;
    }

    private ChatServerUserGroup getDefaultGroupData(ChatServer server) {
        ChatServerUserGroup defaultGroup = new ChatServerUserGroup();
        defaultGroup.setGroupName(this.bundleManager.getMessage("server.user.group.default"));
        defaultGroup.setServer(server);
        return defaultGroup;
    }

    @Override
    @Transactional
    public List<ChatServerDTO> getServers(String userIdentifier) {
        Optional<ServerUser> userOpt = userRepository.findByEmail(userIdentifier);
        if (!userOpt.isPresent()) {
            // TODO
            throw new MessageException("error.credentials.invalid");
        }
        List<ChatServer> servers = serverUserRepository.getUserBelongServers(userOpt.get());
        return servers.stream()
                .map(ChatServerDTO::fromModel)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteServer(long id) {
        ServerUser currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            throw new MessageException("error.credentials.invalid");
        }
        List<ServerUser> serverUsers = this.transactionTemplate.execute(status -> {
            ChatServerUser serverUser = serverUserRepository.getUserByServerId(id, currentUser);
            if (serverUser == null) {
                throw new MessageException("error.credentials.invalid");
            }
            if (serverUser.getUserType() != ServerConstants.SERVER_USER_OWNER) {
                throw new MessageException("error.credentials.invalid");
            }

            ChatServer server = serverUser.getUserGroup().getServer();

            List<ServerUser> serverUserList = serverUserRepository.getServerUsers(server);

            serverUserRepository.deleteByUserGroup_Server(server);
            serverUserGroupRepository.deleteByServer(server);
            serverChannelRepository.deleteByServer(server);

            return serverUserList;
        });
        if (serverUsers != null) {
            notifyServerChanges(currentUser, serverUsers);
        }
    }

    @Override
    @Transactional
    public void exitServer(long id) {
        ServerUser currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            throw new MessageException("error.credentials.invalid");
        }
        ChatServerUser serverUser = serverUserRepository.getUserByServerId(id, currentUser);
        if (serverUser == null) {
            throw new MessageException("error.credentials.invalid");
        }
        if (serverUser.getUserType() == ServerConstants.SERVER_USER_OWNER) {
            throw new MessageException("error.credentials.invalid");
        }
        ChatServer server = serverUser.getUserGroup().getServer();
        List<ServerUser> serverUserList = serverUserRepository.getServerUsers(server);
        serverUserRepository.delete(serverUser);
        notifyServerChanges(currentUser, serverUserList);
        serverUserService.notifyUserGroupChanges(server);
    }

    private void notifyServerChanges(ServerUser currentUser, List<ServerUser> serverUsers) {
        Map<String, ServerUser> emails = serverUsers.stream()
                .collect(Collectors.toMap(ServerUser::getEmail, Function.identity()));

        BiaMessage messageData = new BiaMessage();
        messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
        messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVERS);
        MessageFromUser fromUser = MessageBuilder.buildFromUser(currentUser);
        messageData.setMessageFrom(fromUser);
        for (WebSocketSession session : sessionService.getSessions()) {
            String userEmail = sessionService.getSessionUser(session).getUsername();
            if (emails.containsKey(userEmail)) {
                ServerUser emailMappedUser = emails.get(userEmail);

                MessageToUser toUser = new MessageToUser();
                toUser.setUserId(emailMappedUser.getId());
                toUser.setUsername(emailMappedUser.getUsername());
                messageData.setMessageTo(toUser);

                List<ChatServerDTO> servers = getServers(userEmail);
                try {
                    byte[] serversBytes = om.writeValueAsString(servers).getBytes();
                    messageData.setMessage(serversBytes);
                    messageService.sendMessage(session, messageData);
                } catch (JsonProcessingException e) {
                    log.error("Failed to parse data of server list", e);
                }
            }
        }
    }

    @Override
    @Transactional
    public void notifyServerChanges(ChatServer server) {
        ServerUser currentUser = userService.getCurrentUser();
        List<ServerUser> serverUsers = serverUserRepository.getServerUsers(server);
        notifyServerChanges(currentUser, serverUsers);
    }


    private void notifyServerChangesToUser(ServerUser user) {
        WebSocketSession session = sessionService.getSessionByIdentifier(user.getEmail());
        List<ChatServerDTO> servers = getServers(user.getEmail());

        BiaMessage messageData = new BiaMessage();

        messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
        messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVERS);
        MessageFromUser fromUser = MessageBuilder.buildFromUser(user);
        messageData.setMessageFrom(fromUser);

        MessageToUser toUser = new MessageToUser();
        toUser.setUserId(user.getId());
        toUser.setUsername(user.getUsername());
        messageData.setMessageTo(toUser);

        try {
            byte[] serversBytes = om.writeValueAsString(servers).getBytes();
            messageData.setMessage(serversBytes);
            messageService.sendMessage(session, messageData);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of server list", e);
        }
    }

    @Override
    @Transactional
    public void validateServerUser(long serverId, String email) {
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
    }

    @Override
    @Transactional
    public ChatServerUser validateUserIsOwnerAndGet(long severId, ServerUser user) {
        ChatServerUser serverUser = serverUserRepository.getUserByServerId(severId, user);
        if (serverUser == null || serverUser.getUserType() != ServerConstants.SERVER_USER_OWNER) {
            return null;
        }
        return serverUser;
    }

    @Override
    @Transactional
    public void inviteUser(final InviteUserDTO data) {
        ServerUser currentUser = userService.getCurrentUser();
        ChatServerUser serverUser = validateUserIsOwnerAndGet(data.getServerId(), currentUser);
        if (serverUser == null) {
            throw new MessageException("error.credentials.invalid");
        }
        ChatServer server = serverUser.getUserGroup().getServer();
        String toUserString = data.getToUser();
        String[] toUserSplits = toUserString.split("#");
        if (toUserSplits.length != 2) {
            throw new MessageException("error.user.invite.to-user.invalid");
        }
        String username = toUserSplits[0];
        int tag;
        try {
            tag = Integer.parseInt(toUserSplits[1]);
        } catch (NumberFormatException e) {
            log.error("Invalid tag value {}", toUserSplits[1], e);
            throw new MessageException("error.user.invite.to-user.invalid");
        }
        Optional<ServerUser> userOpt = userRepository.findByUsernameAndTag(username, tag);
        if (!userOpt.isPresent()) {
            log.warn("User {} not exists", toUserString);
            return;
        }
        ServerUser toUserData = userOpt.get();
        if (toUserData.getId() == currentUser.getId()) {
            log.warn("Can't invite user self");
            return;
        }

        String inviteId = UUID.randomUUID().toString();

        BiaMessage messageData = new BiaMessage();
        messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
        messageData.setMessageType(MessageConstants.MessageTypes.TYPE_SERVER_INVITE);
        MessageFromUser fromUser = MessageBuilder.buildFromUser(currentUser);
        messageData.setMessageFrom(fromUser);

        MessageToUser toUser = new MessageToUser();
        toUser.setUserId(toUserData.getId());
        toUser.setUsername(toUserData.getUsername());
        messageData.setMessageTo(toUser);

        InviteToServerWrapDTO inviteToServerWrap = new InviteToServerWrapDTO(
                inviteId,
                toUserData.getId(),
                ChatServerDTO.fromModel(server));
        try {
            byte[] messageBytes = om.writeValueAsString(inviteToServerWrap).getBytes();
            messageData.setMessage(messageBytes);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of invitation", e);
            return;
        }

        WebSocketSession toSession = sessionService.getSessionByIdentifier(toUserData.getEmail());
        if (toSession != null) {
            messageService.sendMessage(toSession, messageData);

            String inviteCacheId = getInviteRedisKey(inviteId);
            redisTemplate.opsForValue().set(inviteCacheId, inviteToServerWrap);
            redisTemplate.expire(inviteCacheId, 30, TimeUnit.MINUTES);
        }
    }

    private String getInviteRedisKey(String inviteId) {
        return INVITE_USER_KEY + '-' + inviteId;
    }

    @Override
    @Transactional
    public void resolveInvite(ResolveServerInviteDTO req) {
        ServerUser currentUser = userService.getCurrentUser();
        String inviteCacheId = getInviteRedisKey(req.getInviteId());
        InviteToServerWrapDTO inviteToServerWrap = (InviteToServerWrapDTO) redisTemplate
                .opsForValue()
                .get(inviteCacheId);
        if (inviteToServerWrap == null) {
            throw new MessageException("error.user.invite.timeout");
        }
        ChatServerDTO toServerDTO = inviteToServerWrap.getToServer();
        ChatServer toServer = chatServerRepository.getOne(toServerDTO.getId());
        if (toServer == null) {
            log.warn("Server not exists of id {}", toServerDTO.getId());
            return;
        }
        if (currentUser.getId() != inviteToServerWrap.getUserId()) {
            log.warn("Server invitation is for user {}", inviteToServerWrap.getUserId());
            return;
        }
        if (!req.isAccept()) {
            redisTemplate.delete(inviteCacheId);
            return;
        }
        ChatServerUserGroup userGroup = serverUserGroupRepository.findFirstByServer(toServer);
        ChatServerUser serverUser = new ChatServerUser();
        serverUser.setUserType(ServerConstants.SERVER_USER_MEMBER);
        serverUser.setUser(currentUser);
        serverUser.setUserGroup(userGroup);
        serverUserRepository.save(serverUser);
        redisTemplate.delete(inviteCacheId);
        notifyServerChangesToUser(currentUser);
        serverUserService.notifyUserGroupChanges(toServer);
    }
}
