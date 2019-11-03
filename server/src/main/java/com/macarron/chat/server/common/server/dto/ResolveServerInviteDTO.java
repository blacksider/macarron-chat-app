package com.macarron.chat.server.common.server.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;

@Setter
@Getter
public class ResolveServerInviteDTO {
    @NotEmpty
    private String inviteId;
    private boolean accept;
}
