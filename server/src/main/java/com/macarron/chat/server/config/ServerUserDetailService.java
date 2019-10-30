package com.macarron.chat.server.config;

import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ServerUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
public class ServerUserDetailService implements UserDetailsService {
    private ServerUserRepository userRepository;

    @Autowired
    public void setUserRepository(ServerUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Assert.isTrue(StringUtils.hasText(username), "login name should not be empty");
        final Optional<ServerUser> userOpt = this.userRepository.findByEmail(username);
        if (!userOpt.isPresent()) {
            throw new UsernameNotFoundException("User: " + username + " was not found in the " + "database");
        }
        ServerUser user = userOpt.get();
        if (!user.isEnabled()) {
            throw new UsernameNotFoundException("User: " + username + " is not enabled");
        }
        return new User(user.getEmail(), user.getPassword(), user.getAuthorities());
    }
}
