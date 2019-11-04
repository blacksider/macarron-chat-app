package com.macarron.chat.server.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.message.MessageBuilder;
import com.macarron.chat.server.common.message.MessageConstants;
import com.macarron.chat.server.common.message.vo.MessageFromUser;
import com.macarron.chat.server.common.message.vo.MessageToServerChannel;
import com.macarron.chat.server.common.user.ServerUserDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerChannel;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerChannelRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.repository.ServerUserRepository;
import com.macarron.chat.server.service.ChatServerService;
import com.macarron.chat.server.service.PlayerToChannelService;
import com.macarron.chat.server.service.UserMessageService;
import com.macarron.chat.server.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.web.socket.WebSocketSession;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class PlayerToChannelServiceImpl implements PlayerToChannelService {
    private static final String IN_CHANNEL_PLAYER_CACHE = "IN_CHANNEL_PLAYER_";
    private final ObjectMapper om = new ObjectMapper();

    private ChatServerService serverService;
    private ChatServerChannelRepository serverChannelRepository;
    private UserSessionService sessionService;
    private ServerUserRepository userRepository;
    private RedisTemplate<String, Long> inChannelPlayerCacheTemplate;
    private UserMessageService messageService;
    private ChatServerUserRepository serverUserRepository;

    @Autowired
    public void setServerService(ChatServerService serverService) {
        this.serverService = serverService;
    }

    @Autowired
    public void setServerChannelRepository(ChatServerChannelRepository serverChannelRepository) {
        this.serverChannelRepository = serverChannelRepository;
    }

    @Autowired
    public void setSessionService(UserSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Autowired
    public void setInChannelPlayerCacheTemplate(RedisTemplate<String, Long> inChannelPlayerCacheTemplate) {
        this.inChannelPlayerCacheTemplate = inChannelPlayerCacheTemplate;
    }

    @Autowired
    public void setUserRepository(ServerUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setMessageService(UserMessageService messageService) {
        this.messageService = messageService;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Override
    @Transactional
    public void handlePlayerToChannelMessage(WebSocketSession session, BiaMessage message) {
        MessageToServerChannel toChannel = (MessageToServerChannel) message.getMessageTo();

        String email = sessionService.getSessionUser(session).getUsername();
        this.serverService.validateServerUser(toChannel.getServerId(), email);

        Optional<ChatServerChannel> chOpt = this.serverChannelRepository.findById(toChannel.getChannelId());
        if (!chOpt.isPresent()) {
            log.warn("Try to handle player to channel message of type [{}] but channel {} not found",
                    message.getMessageType(), toChannel.getChannelId());
            return;
        }
        Optional<ServerUser> userOpt = this.userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            throw new MessageException("error.credentials.invalid");
        }

        ServerUser user = userOpt.get();
        switch (message.getMessageType()) {
            case MessageConstants.MessageTypes.TYPE_ON_PLAYER_JOIN_CHANNEL: {
                onUserJoinChannel(message, user, chOpt.get());
                break;
            }
            case MessageConstants.MessageTypes.TYPE_ON_PLAYER_LEFT_CHANNEL: {
                onUserLeftChannel(message, user, chOpt.get());
                break;
            }
            default: {
                log.warn("Invalid message type {}", message.getMessageType());
                break;
            }
        }
    }

    private void onUserJoinChannel(BiaMessage message, ServerUser user, ChatServerChannel channel) {
        String inChPlayerKey = getInChannelPlayerCacheKey(channel.getId());
        inChannelPlayerCacheTemplate.opsForSet().add(inChPlayerKey, user.getId());

        ServerUserDTO userDTO = ServerUserDTO.fromModel(user);
        if (userDTO == null) {
            log.warn("Failed to parse user dto");
            return;
        }
        List<ServerUser> players = serverUserRepository.getServerUsers(channel.getServer());
        if (CollectionUtils.isEmpty(players)) {
            return;
        }
        try {
            byte[] messageBytes = om.writeValueAsString(userDTO).getBytes();
            message.setMessage(messageBytes);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse user dto to bytes", e);
            return;
        }
        message.setMessageType(MessageConstants.MessageTypes.TYPE_PLAYER_JOIN_CHANNEL);
        sendMessageToPlayers(message, players);
    }

    private void onUserLeftChannel(BiaMessage message, ServerUser user, ChatServerChannel channel) {
        String inChPlayerKey = getInChannelPlayerCacheKey(channel.getId());
        List<ServerUser> players = serverUserRepository.getServerUsers(channel.getServer());
        if (CollectionUtils.isEmpty(players)) {
            return;
        }
        inChannelPlayerCacheTemplate.opsForSet().remove(inChPlayerKey, user.getId());
        message.setMessageType(MessageConstants.MessageTypes.TYPE_PLAYER_LEFT_CHANNEL);
        sendMessageToPlayers(message, players);
    }

    private void sendMessageToPlayers(BiaMessage message, List<ServerUser> players) {
        for (ServerUser player : players) {
            WebSocketSession session = sessionService.getSessionByIdentifier(player.getEmail());
            messageService.sendMessage(session, message);
        }
    }

    private String getInChannelPlayerCacheKey(long channelId) {
        return IN_CHANNEL_PLAYER_CACHE + channelId;
    }

    @Override
    @Transactional
    public void handlePlayerCloseConnection(WebSocketSession session) {
        String email = sessionService.getSessionUser(session).getUsername();
        Optional<ServerUser> userOpt = this.userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            return;
        }
        ServerUser user = userOpt.get();
        List<ChatServer> belongsTo = serverUserRepository.getUserBelongServers(user);
        List<ChatServerChannel> channels = serverChannelRepository.findByServerIn(belongsTo);

        if (!CollectionUtils.isEmpty(channels)) {
            ChatServerChannel inChannel = null;
            for (ChatServerChannel channel : channels) {
                String inChPlayerKey = getInChannelPlayerCacheKey(channel.getId());
                Boolean inSet = inChannelPlayerCacheTemplate.opsForSet().isMember(inChPlayerKey, user.getId());
                if (Boolean.TRUE.equals(inSet)) {
                    inChannel = channel;
                    break;
                }
            }
            if (inChannel != null) {
                BiaMessage message = new BiaMessage();
                MessageFromUser fromUser = MessageBuilder.buildFromUser(user);
                message.setMessageFrom(fromUser);
                message.setTime(ZonedDateTime.now().toInstant().toEpochMilli());

                MessageToServerChannel toServerChannel = new MessageToServerChannel();
                toServerChannel.setChannelId(inChannel.getId());
                toServerChannel.setServerId(inChannel.getServer().getId());
                message.setMessageTo(toServerChannel);

                onUserLeftChannel(message, user, inChannel);
            }
        }
    }

    @Override
    @Transactional
    public Map<Long, List<ServerUserDTO>> getChannelsUsers(List<Long> channelIds) {
        Map<Long, List<ServerUserDTO>> result = new HashMap<>();
        for (Long channelId : channelIds) {
            List<ServerUserDTO> userList = new ArrayList<>();
            result.put(channelId, userList);
            String inChPlayerKey = getInChannelPlayerCacheKey(channelId);
            Set<Long> players = inChannelPlayerCacheTemplate.opsForSet().members(inChPlayerKey);
            if (!CollectionUtils.isEmpty(players)) {
                List<ServerUser> users = userRepository.findAllById(players);
                for (ServerUser user : users) {
                    userList.add(ServerUserDTO.fromModel(user));
                }
            }
        }
        return result;
    }
}
