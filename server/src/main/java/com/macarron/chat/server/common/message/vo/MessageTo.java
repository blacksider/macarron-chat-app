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
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type", visible = true)
@JsonSubTypes({
        @JsonSubTypes.Type(value = MessageToUser.class,
                name = MessageConstants.MessageToTypes.MESSAGE_TO_USER),
        @JsonSubTypes.Type(value = MessageToServerChannel.class,
                name = MessageConstants.MessageToTypes.MESSAGE_TO_SERVER_CHANNEL),
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class MessageTo implements Serializable {
    private static final long serialVersionUID = 3947439713630104338L;
    private String type;
}
