package com.macarron.chat.server.model;

import lombok.Getter;
import lombok.Setter;

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
@Table(name = "chat_server")
public class ChatServer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column(name = "server_name")
    private String serverName;
    @Lob
    @Column(name = "avatar")
    private byte[] avatar;
    @Column(name = "create_time", nullable = false)
    private Instant createTime;
    @Column(name = "update_time", nullable = false)
    private Instant updateTime;
}
