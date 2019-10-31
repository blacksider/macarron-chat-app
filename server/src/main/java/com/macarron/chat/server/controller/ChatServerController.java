package com.macarron.chat.server.controller;

import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;
import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.service.ChatServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatServerController {
    private ChatServerService serverService;

    @Autowired
    public void setServerService(ChatServerService serverService) {
        this.serverService = serverService;
    }

    @PostMapping("/api/server")
    void createServer(@RequestBody @Validated CreateServerReqDTO req) {
        ChatServer server = serverService.createServer(req);
        serverService.notifyServerChanges(server);
    }
}
