package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.model.ChatServerChannel;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ChatServerChannelRepository;
import com.macarron.chat.server.repository.ChatServerUserRepository;
import com.macarron.chat.server.repository.ServerUserRepository;
import com.macarron.chat.server.service.ChatServerChannelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatServerChannelServiceImpl implements ChatServerChannelService {
    private ChatServerChannelRepository serverChannelRepository;
    private ServerUserRepository userRepository;
    private ChatServerUserRepository serverUserRepository;

    @Autowired
    public void setUserRepository(ServerUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setServerChannelRepository(ChatServerChannelRepository serverChannelRepository) {
        this.serverChannelRepository = serverChannelRepository;
    }

    @Autowired
    public void setServerUserRepository(ChatServerUserRepository serverUserRepository) {
        this.serverUserRepository = serverUserRepository;
    }

    @Override
    @Transactional
    public List<ChatServerChannelDTO> getServerChannels(long serverId, String email) {
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
        List<ChatServerChannel> channels = serverChannelRepository.findByServer_Id(serverId);
        return channels.stream()
                .map(ChatServerChannelDTO::fromModel)
                .collect(Collectors.toList());
    }
}
