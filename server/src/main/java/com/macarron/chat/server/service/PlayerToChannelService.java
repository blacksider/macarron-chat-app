package com.macarron.chat.server.service;

import com.macarron.chat.server.common.message.BiaMessage;
import com.macarron.chat.server.common.user.ServerUserDTO;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;
import java.util.Map;

public interface PlayerToChannelService {
    void handlePlayerToChannelMessage(WebSocketSession session, BiaMessage message);

    void handlePlayerCloseConnection(WebSocketSession session);

    Map<Long, List<ServerUserDTO>> getChannelsUsers(List<Long> channelIds);
}
