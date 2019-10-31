package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;
import com.macarron.chat.server.model.ChatServer;

import java.util.List;

public interface ChatServerService {
    ChatServer createServer(CreateServerReqDTO req);

    List<ChatServerDTO> getServers(String userIdentifier);

    void notifyServerChanges(ChatServer server);
}
