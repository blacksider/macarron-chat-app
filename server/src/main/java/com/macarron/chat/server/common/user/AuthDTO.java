package com.macarron.chat.server.common.user;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;

@Getter
@Setter
public class AuthDTO {
    @NotEmpty
    private String loginName;
    @NotEmpty
    private String password;
}
