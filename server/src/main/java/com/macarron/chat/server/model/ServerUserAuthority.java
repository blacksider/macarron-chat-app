package com.macarron.chat.server.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Getter
@Setter
@Entity
@Table(name = "server_user_authority", uniqueConstraints = {
        @UniqueConstraint(name = "uk_server_user_authority", columnNames = "authority")
})
public class ServerUserAuthority implements GrantedAuthority {
    private static final long serialVersionUID = 7805352014959544522L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column
    private String authority;

    @Override
    public String getAuthority() {
        return authority;
    }
}
