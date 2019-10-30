package com.macarron.chat.server.exception;

import com.macarron.chat.server.i18n.MessageBundleManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@ControllerAdvice(annotations = RestController.class)
public class MessageExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(MessageExceptionHandler.class);
    private MessageBundleManager messageBundleManager;

    @Autowired
    public void setMessageBundleManager(MessageBundleManager messageBundleManager) {
        this.messageBundleManager = messageBundleManager;
    }

    @ExceptionHandler(MessageException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public ErrorResponse handleMessageException(MessageException e) {
        LOGGER.error("Bad request: ", e);
        ErrorResponse resp = new ErrorResponse();
        if (StringUtils.hasText(e.getKey())) {
            resp.setMessage(messageBundleManager.getMessage(e.getKey(), e.getArgs()));
        } else {
            resp.setMessage(null);
        }
        resp.setDetail(e.getDetail());
        return resp;
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public ErrorResponse handleException(Exception e) {
        LOGGER.error("Unexpected error: ", e);
        ErrorResponse resp = new ErrorResponse();
        resp.setMessage(e.getMessage());
        return resp;
    }
}
