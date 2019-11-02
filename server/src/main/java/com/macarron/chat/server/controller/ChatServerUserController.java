package com.macarron.chat.server.controller;

import com.macarron.chat.server.common.server.dto.CreateUserGroupDTO;
import com.macarron.chat.server.service.ChatServerUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatServerUserController {
    private ChatServerUserService serverUserService;

    @Autowired
    public void setServerUserService(ChatServerUserService serverUserService) {
        this.serverUserService = serverUserService;
    }

    @PostMapping("/api/server/user-group")
    void createUserGroup(@RequestBody @Validated CreateUserGroupDTO req) {
        serverUserService.createUserGroup(req);
    }

    @DeleteMapping("/api/server/user-group")
    void createServer(@RequestParam long id) {
        serverUserService.deleteUserGroup(id);
    }
}
