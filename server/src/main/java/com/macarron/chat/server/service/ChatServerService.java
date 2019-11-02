package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;
import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ServerUser;

import java.util.List;

public interface ChatServerService {
    void createServer(CreateServerReqDTO req);

    List<ChatServerDTO> getServers(String userIdentifier);

    void notifyServerChanges(ChatServer server);

    void deleteServer(long id);

    void validateServerUser(long serverId, String email);

    ChatServerUser validateUserIsOwnerAndGet(long severId, ServerUser user);
}
