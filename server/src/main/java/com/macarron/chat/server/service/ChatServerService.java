package com.macarron.chat.server.service;

import com.macarron.chat.server.common.server.dto.ChatServerDTO;
import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;

import java.util.List;

public interface ChatServerService {
    void createServer(CreateServerReqDTO req);

    List<ChatServerDTO> getServers();
}
