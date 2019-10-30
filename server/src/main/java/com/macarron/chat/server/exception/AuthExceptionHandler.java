package com.macarron.chat.server.exception;

import com.macarron.chat.server.i18n.MessageBundleManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class AuthExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(AuthExceptionHandler.class);
    private MessageBundleManager messageBundleManager;

    @Autowired
    public void setMessageBundleManager(MessageBundleManager messageBundleManager) {
        this.messageBundleManager = messageBundleManager;
    }

    @ResponseBody
    @ExceptionHandler(value = AuthenticationException.class)
    public ErrorResponse handleAuthException(AuthenticationException e) {
        logger.error("Auth exception: ", e);
        ErrorResponse resp = new ErrorResponse();
        resp.setMessage(messageBundleManager.getMessage("error.credentials.invalid"));
        return resp;
    }
}
