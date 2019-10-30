package com.macarron.chat.server.service.impl;

import com.macarron.chat.server.common.user.AuthDTO;
import com.macarron.chat.server.common.user.AuthInfoDTO;
import com.macarron.chat.server.common.user.UserRegisterDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.model.ServerUser;
import com.macarron.chat.server.repository.ServerUserAuthorityRepository;
import com.macarron.chat.server.repository.ServerUserRepository;
import com.macarron.chat.server.service.UserService;
import com.macarron.chat.server.util.AuthenticationUtils;
import com.macarron.chat.server.util.AvatarUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;
import org.springframework.util.ResourceUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;

@Slf4j
@Service
public class UserServiceImpl implements UserService {
    private static final String AVATAR_DEFAULT = "classpath:avatar/user_default.png";
    private byte[] bufferedDefaultAvatar;

    private ServerUserRepository userRepository;
    private PasswordEncoder encoder;
    private AuthenticationManager authenticationManager;
    private ServerUserAuthorityRepository authorityRepository;


    @Autowired
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Autowired
    public void setUserRepository(ServerUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    @Qualifier("passwordEncoder")
    public void setEncoder(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @Autowired
    public void setAuthorityRepository(ServerUserAuthorityRepository authorityRepository) {
        this.authorityRepository = authorityRepository;
    }

    @Override
    public Authentication doAuthentication(AuthDTO authRequest) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                authRequest.getLoginName(), new String(Base64.getDecoder().decode(authRequest.getPassword())));
        return this.authenticationManager.authenticate(token);
    }

    @Override
    @Transactional
    public void doRegister(UserRegisterDTO reqData) {
        // TODO should validate email verification code
        boolean exists = userRepository.existsByEmail(reqData.getEmail());
        if (exists) {
            throw new MessageException("error.register.email.exists");
        }
        int tag = this.new TagGenerator(reqData.getUsername()).getTag();
        if (tag == -1) {
            throw new MessageException("error.register.failed");
        }
        ServerUser user = new ServerUser();
        user.setEmail(reqData.getEmail());
        user.setUsername(reqData.getUsername());
        user.setPassword(encoder.encode(new String(Base64.getDecoder().decode(reqData.getPassword()))));
        user.setTag(tag);
        user.setAuthorities(Collections.singleton(authorityRepository.getOne(1L)));
        user.setCreateTime(Instant.now());
        user.setUpdateTime(Instant.now());
        user.setActive(true);
        user.setAvatar(getDefaultAvatar());
        userRepository.save(user);
    }

    private class TagGenerator {
        private String username;
        private int tag;
        private static final int tryTimes = 30;
        private int tried = 1;

        TagGenerator(String username) {
            this.username = username;
            this.tag = getAvailableTag();
        }

        private int getAvailableTag() {
            int tag = randomTag();
            boolean exists = userRepository.existsByUsernameAndTag(username, tag);
            if (exists) {
                tried++;
                if (tried > tryTimes) {
                    return -1;
                }
                return getAvailableTag();
            }
            return tag;
        }

        int getTag() {
            return tag;
        }

        private int randomTag() {
            Random r = new Random();
            int low = 1000;
            int high = 9999;
            return r.nextInt(high - low) + low;
        }
    }

    @Override
    @Transactional
    public ServerUser getCurrentUser() {
        Authentication auth = AuthenticationUtils.getCurrentAuthentication();
        if (auth == null) {
            return null;
        }
        Optional<ServerUser> userOpt = this.userRepository.findByEmail(auth.getName());
        return userOpt.orElse(null);
    }

    @Override
    @Transactional
    public AuthInfoDTO getAuthInfo() {
        ServerUser user = getCurrentUser();
        if (user == null) {
            return null;
        }
        AuthInfoDTO authInfo = new AuthInfoDTO();
        authInfo.setUserId(user.getId());
        authInfo.setUsername(user.getUsername());
        authInfo.setTag(user.getTag());
        authInfo.setAvatar(AvatarUtils.parseToBase64Png(user.getAvatar()));
        authInfo.setAuthorities(AuthenticationUtils.mapAuthorities(user.getAuthorities()));
        return authInfo;
    }

    private byte[] getDefaultAvatar() {
        if (bufferedDefaultAvatar != null) {
            return bufferedDefaultAvatar;
        }
        try {
            File defaultAvatarImg = ResourceUtils.getFile(AVATAR_DEFAULT);
            this.bufferedDefaultAvatar = FileCopyUtils.copyToByteArray(defaultAvatarImg);
            return bufferedDefaultAvatar;
        } catch (FileNotFoundException e) {
            log.error("Failed to find default user avatar image", e);
            throw new MessageException("error.unknown");
        } catch (IOException e) {
            log.error("Failed to read default user avatar image", e);
            throw new MessageException("error.unknown");
        }
    }
}
