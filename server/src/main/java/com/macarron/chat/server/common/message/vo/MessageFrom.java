package com.macarron.chat.server.common.message.vo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.macarron.chat.server.common.message.MessageConstants;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "type", visible = true)
@JsonSubTypes({
        @JsonSubTypes.Type(value = MessageFromUser.class, name = MessageConstants.MESSAGE_FROM_USER),
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class MessageFrom implements Serializable {
    private static final long serialVersionUID = -7978642720208484992L;
    private String type;
}
