package com.macarron.chat.server.controller;

import com.macarron.chat.server.common.server.dto.CreateChannelDTO;
import com.macarron.chat.server.service.ChatServerChannelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatServerChannelController {
    private ChatServerChannelService channelService;

    @Autowired
    public void setChannelService(ChatServerChannelService channelService) {
        this.channelService = channelService;
    }

    @PostMapping("/api/server/channel")
    void addChannel(@RequestBody @Validated CreateChannelDTO req) {
        channelService.addChannel(req);
    }

    @DeleteMapping("/api/server/channel")
    void createServer(@RequestParam long id) {
        channelService.deleteChannel(id);
    }
}
