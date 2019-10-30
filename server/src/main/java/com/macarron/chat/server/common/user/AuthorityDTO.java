package com.macarron.chat.server.common.user;

import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

@Setter
public class AuthorityDTO implements GrantedAuthority {
    private static final long serialVersionUID = 6524628934760763293L;
    private String authority;

    @Override
    public String getAuthority() {
        return authority;
    }
}
