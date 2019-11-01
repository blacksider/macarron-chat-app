package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;
import com.macarron.chat.server.common.server.dto.CreateChannelDTO;

import java.util.List;

public interface ChatServerChannelService {
    List<ChatServerChannelDTO> getServerChannels(long serverId, String email);

    void addChannel(final CreateChannelDTO req);

    void deleteChannel(long channelId);
}
