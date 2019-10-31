package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerChannelDTO;

import java.util.List;

public interface ChatServerChannelService {
    List<ChatServerChannelDTO> getServerChannels(long serverId, String email);
}
