package com.macarron.chat.server.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.message.MessageBuilder;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.message.vo.MessageFromUser;
import com.macarron.chat.server.common.server.ServerConstants;
import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;
import com.macarron.chat.server.common.server.dto.CreateChannelDTO;
import com.macarron.chat.server.common.server.dto.ServerChannelWrapDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerChannel;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerChannelRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.service.ChatServerChannelService;
import com.macarron.chat.server.service.ChatServerService;
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
public class ChatServerChannelServiceImpl implements ChatServerChannelService {
    private final ObjectMapper om = new ObjectMapper();

    private ChatServerChannelRepository serverChannelRepository;
    private ChatServerUserRepository serverUserRepository;
    private TransactionTemplate transactionTemplate;
    private UserService userService;
    private ChatServerService serverService;
    private UserMessageService messageService;

    @Autowired
    public void setServerChannelRepository(ChatServerChannelRepository serverChannelRepository) {
        this.serverChannelRepository = serverChannelRepository;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Autowired
    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }

    @Autowired
    public void setServerService(ChatServerService serverService) {
        this.serverService = serverService;
    }

    @Autowired
    public void setMessageService(UserMessageService messageService) {
        this.messageService = messageService;
    }

    @Override
    @Transactional
    public List<ChatServerChannelDTO> getServerChannels(long serverId, String email) {
        serverService.validateServerUser(serverId, email);
        return getServerChannels(serverId);
    }

    private List<ChatServerChannelDTO> getServerChannels(long serverId) {
        List<ChatServerChannel> channels = serverChannelRepository.findByServer_Id(serverId);
        return channels.stream()
                .map(ChatServerChannelDTO::fromModel)
                .collect(Collectors.toList());
    }

    @Override
    public void addChannel(CreateChannelDTO req) {
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

            boolean exists = serverChannelRepository.existsByServerAndChannelName(server, req.getChannelName());
            if (exists) {
                throw new MessageException("error.channel.name.exists");
            }

            ChatServerChannel newChannel = new ChatServerChannel();

            newChannel.setChannelName(req.getChannelName());
            newChannel.setServer(server);
            serverChannelRepository.save(newChannel);

            return server;
        });
        // notify all user belong to this server
        notifyChannelChanges(changedServer);
    }

    private void notifyChannelChanges(ServerUser currentUser, ChatServer server, List<ServerUser> serverUsers) {
        Map<String, ServerUser> emails = serverUsers.stream()
                .collect(Collectors.toMap(ServerUser::getEmail, Function.identity()));

        BiaMessage messageData = new BiaMessage();
        messageData.setTime(ZonedDateTime.now().toInstant().toEpochMilli());
        messageData.setMessageType(MessageConstants.MessageTypes.TYPE_REPLY_SERVER_CHANNELS);
        MessageFromUser fromUser = MessageBuilder.buildFromUser(currentUser);
        messageData.setMessageFrom(fromUser);
        List<ChatServerChannelDTO> channels = getServerChannels(server.getId());
        ServerChannelWrapDTO data = new ServerChannelWrapDTO(server.getId(), channels);
        try {
            byte[] messageBytes = om.writeValueAsString(data).getBytes();
            messageData.setMessage(messageBytes);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse data of channel list", e);
            return;
        }
        messageService.sendMessageBelongsTO(messageData, emails);
    }

    @Override
    @Transactional
    public void notifyChannelChanges(ChatServer server) {
        ServerUser currentUser = userService.getCurrentUser();
        List<ServerUser> serverUsers = serverUserRepository.getServerUsers(server);
        notifyChannelChanges(currentUser, server, serverUsers);
    }

    @Override
    public void deleteChannel(long channelId) {
        ServerUser currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            throw new MessageException("error.credentials.invalid");
        }
        Pair<ChatServer, List<ServerUser>> res = this.transactionTemplate.execute(status -> {
            Optional<ChatServerChannel> serverChannelOpt = serverChannelRepository.findById(channelId);
            if (!serverChannelOpt.isPresent()) {
                throw new MessageException("error.credentials.invalid");
            }
            ChatServerChannel channel = serverChannelOpt.get();
            ChatServerUser serverUser = serverService.validateUserIsOwnerAndGet(channel.getServer().getId(), currentUser);
            if (serverUser == null) {
                throw new MessageException("error.credentials.invalid");
            }

            ChatServer server = channel.getServer();
            long channelCount = serverChannelRepository.countByServer(server);
            if (channelCount == 1) {
                throw new MessageException("error.channel.last");
            }

            List<ServerUser> serverUserList = serverUserRepository.getServerUsers(server);

            serverChannelRepository.delete(channel);

            return Pair.of(server, serverUserList);
        });
        if (res != null) {
            notifyChannelChanges(currentUser, res.getFirst(), res.getSecond());
        }
    }
}
