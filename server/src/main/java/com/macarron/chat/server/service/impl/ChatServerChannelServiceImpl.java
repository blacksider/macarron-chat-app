package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;
import com.macarron.chat.server.model.ChatServerChannel;
import com.macarron.chat.server.repository.ChatServerChannelRepository;
import com.macarron.chat.server.service.ChatServerChannelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatServerChannelServiceImpl implements ChatServerChannelService {
    private ChatServerChannelRepository serverChannelRepository;

    @Autowired
    public void setServerChannelRepository(ChatServerChannelRepository serverChannelRepository) {
        this.serverChannelRepository = serverChannelRepository;
    }

    @Override
    public List<ChatServerChannelDTO> getServerChannels(long serverId) {
        List<ChatServerChannel> channels = serverChannelRepository.findByServer_Id(serverId);
        return channels.stream()
                .map(ChatServerChannelDTO::fromModel)
                .collect(Collectors.toList());
    }
}
