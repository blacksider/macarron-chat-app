package com.macarron.chat.server.service;

import com.macarron.chat.server.common.user.AuthDTO;
import com.macarron.chat.server.common.user.AuthInfoDTO;
import com.macarron.chat.server.common.user.UserRegisterDTO;
import com.macarron.chat.server.model.ServerUser;
import org.springframework.security.core.Authentication;

public interface UserService {
    Authentication doAuthentication(AuthDTO authRequest);

    void doRegister(UserRegisterDTO reqData);

    AuthInfoDTO getAuthInfo();

    ServerUser getCurrentUser();
}
