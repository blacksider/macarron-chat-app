package com.macarron.chat.server.common.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InviteToServerWrapDTO {
    private String inviteId;
    private long userId;
    private ChatServerDTO toServer;
}
