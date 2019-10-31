package com.macarron.chat.server.common.server.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;

@Getter
@Setter
public class CreateServerReqDTO {
    @NotEmpty
    private String name;
}
