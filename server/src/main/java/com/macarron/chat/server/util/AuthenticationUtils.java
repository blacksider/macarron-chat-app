package com.macarron.chat.server.util;

import com.macarron.chat.server.common.user.AuthorityDTO;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class AuthenticationUtils {
    private AuthenticationUtils() {
    }

    public static Authentication getCurrentAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return auth;
    }

    public static List<AuthorityDTO> mapAuthorities(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream()
                .map(o -> {
                    if (o instanceof AuthorityDTO) {
                        return (AuthorityDTO) o;
                    }
                    AuthorityDTO authority = new AuthorityDTO();
                    authority.setAuthority(o.getAuthority());
                    return authority;
                }).collect(Collectors.toList());
    }
}
