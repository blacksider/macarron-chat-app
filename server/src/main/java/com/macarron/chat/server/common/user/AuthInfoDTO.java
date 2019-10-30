package com.macarron.chat.server.common.user;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AuthInfoDTO {
    private long userId;
    private String username;
    private int tag;
    private String avatar;
    private List<AuthorityDTO> authorities;
}
