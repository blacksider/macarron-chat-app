package com.macarron.chat.server.model;

import com.macarron.chat.server.common.message.vo.MessageFrom;
import com.macarron.chat.server.common.message.vo.MessageTo;
import com.macarron.chat.server.config.type.JsonBinaryType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "user_message")
@TypeDefs({
        @TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
})
public class UserMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Type(type = "jsonb")
    @Column(name = "message_from")
    private MessageFrom messageFrom;
    @Type(type = "jsonb")
    @Column(name = "message_to")
    private MessageTo messageTo;
    /**
     * ref to
     * {@link com.macarron.chat.server.common.message.MessageConstants#TYPE_FILE}
     * {@link com.macarron.chat.server.common.message.MessageConstants#TYPE_IMG}
     * {@link com.macarron.chat.server.common.message.MessageConstants#TYPE_TEXT}
     */
    @Column(name = "message_type")
    private int messageType;
    @Lob
    @Column(name = "message")
    private byte[] message;
    @Column(name = "create_time", nullable = false)
    private Instant createTime;
    @Column(name = "update_time", nullable = false)
    private Instant updateTime;
}
