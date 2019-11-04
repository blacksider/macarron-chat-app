package com.macarron.chat.server.controller;

import com.macarron.chat.server.common.user.AuthDTO;
import com.macarron.chat.server.common.user.AuthInfoDTO;
import com.macarron.chat.server.common.user.UserRegisterDTO;
import com.macarron.chat.server.exception.MessageException;
import com.macarron.chat.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.session.SessionRepository;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;

@RestController
public class AuthController {
    private UserService userService;
    private SessionRepository sessionRepository;

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }

    @Autowired
    public void setSessionRepository(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @PostMapping("/api/auth/login")
    void doLogin(@RequestBody @Valid AuthDTO reqData, HttpServletRequest request) {
        HttpSession existedSession = request.getSession(false);
        if (existedSession != null) {
            SecurityContext context = (SecurityContext) existedSession.getAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
            Assert.notNull(context, "Unknown error with empty security context");
            final String currentTokenUserName = context.getAuthentication().getName();
            if (reqData.getLoginName().equals(currentTokenUserName)) {
                return;
            }
        }
        try {
            Authentication userAuth = this.userService.doAuthentication(reqData);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(userAuth);
            HttpSession newSession = request.getSession(true);
            newSession.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
        } catch (AuthenticationException e) {
            throw new MessageException("error.login.credentials");
        }
    }

    @PostMapping("/api/auth/register")
    void doRegister(@RequestBody @Valid UserRegisterDTO reqData) {
        userService.doRegister(reqData);
    }

    @GetMapping("/api/auth/logout")
    void userLogout(HttpServletRequest request) {
        HttpSession existedSession = request.getSession(false);
        if (existedSession != null) {
            existedSession.invalidate();
            sessionRepository.deleteById(existedSession.getId());
        }

        SecurityContext context = SecurityContextHolder.getContext();
        context.setAuthentication(null);
        SecurityContextHolder.clearContext();
    }

    @GetMapping("/api/auth/info")
    AuthInfoDTO getLoginUserIdentity(HttpServletResponse response) {
        AuthInfoDTO authInfo = userService.getAuthInfo();
        if (authInfo == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return null;
        }
        return authInfo;
    }

    @RequestMapping(value = "/api/user/check", method = RequestMethod.GET)
    String userCheck() {
        return "OK";
    }
}
