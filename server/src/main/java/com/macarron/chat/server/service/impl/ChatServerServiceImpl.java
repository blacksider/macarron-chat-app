package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.common.server.ServerConstants;
import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;
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
import com.macarron.chat.server.service.ChatServerService;
import com.macarron.chat.server.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;
import org.springframework.util.ResourceUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatServerServiceImpl implements ChatServerService {
    private static final String AVATAR_DEFAULT = "classpath:avatar/server_default.png";
    private byte[] bufferedDefaultAvatar;

    private UserService userService;
    private MessageBundleManager bundleManager;
    private ChatServerRepository chatServerRepository;
    private ChatServerChannelRepository serverChannelRepository;
    private ChatServerUserGroupRepository serverUserGroupRepository;
    private ChatServerUserRepository serverUserRepository;

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
    @Transactional
    public void createServer(CreateServerReqDTO req) {
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
    public List<ChatServerDTO> getServers() {
        ServerUser user = userService.getCurrentUser();
        if (user == null) {
            throw new MessageException("error.credentials.invalid");
        }
        List<ChatServer> servers = serverUserRepository.getUserBelongServers(user);
        return servers.stream()
                .map(ChatServerDTO::fromModel)
                .collect(Collectors.toList());
    }
}
