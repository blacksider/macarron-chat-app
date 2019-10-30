package com.macarron.chat.server.model;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ForeignKey;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Getter
@Setter
@Entity
@Table(name = "chat_server_user")
public class ChatServerUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chat_user_user_user_id"))
    private ServerUser user;
    /**
     * {@link com.macarron.chat.server.common.server.ServerConstants#SERVER_USER_OWNER} owner
     * {@link com.macarron.chat.server.common.server.ServerConstants#SERVER_USER_MEMBER} member
     */
    @Column(name = "user_type")
    private int userType;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_chat_user_user_group_id"))
    private ChatServerUserGroup userGroup;

}
