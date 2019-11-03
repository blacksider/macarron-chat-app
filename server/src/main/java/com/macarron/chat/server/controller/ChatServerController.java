package com.macarron.chat.server.controller;

import com.macarron.chat.server.common.server.dto.CreateServerReqDTO;
import com.macarron.chat.server.common.server.dto.InviteUserDTO;
import com.macarron.chat.server.common.server.dto.ResolveServerInviteDTO;
import com.macarron.chat.server.service.ChatServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
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
        serverService.createServer(req);
    }

    @DeleteMapping("/api/server")
    void deleteServer(@RequestParam long id) {
        serverService.deleteServer(id);
    }

    @DeleteMapping("/api/server/exit")
    void exitServer(@RequestParam long id) {
        serverService.exitServer(id);
    }

    @PostMapping("/api/server/invite")
    void inviteUser(@RequestBody @Validated InviteUserDTO req) {
        serverService.inviteUser(req);
    }

    @PostMapping("/api/server/invite/resolve")
    void resolveInvite(@RequestBody @Validated ResolveServerInviteDTO req) {
        serverService.resolveInvite(req);
    }
}
