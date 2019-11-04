package com.macarron.chat.server.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.userdetails.UserDetails;

import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ForeignKey;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.Lob;
import javax.persistence.ManyToMany;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "server_user", uniqueConstraints = {
        @UniqueConstraint(name = "uk_server_user_email", columnNames = "email")
})
public class ServerUser implements UserDetails {
    private static final long serialVersionUID = -4048023503863864598L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column
    private String username;
    @Column(nullable = false)
    private int tag;
    @Column(nullable = false)
    private String email;
    @Column
    private String password;
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "avatar")
    private byte[] avatar;
    @Column
    private boolean active;
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "server_user_authorities",
            joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id",
                    foreignKey = @ForeignKey(name = "fk_server_user_authorities_user_id")),
            inverseJoinColumns = @JoinColumn(name = "authority_id", referencedColumnName = "id",
                    foreignKey = @ForeignKey(name = "fk_server_user_authorities_authority_id")))
    private Set<ServerUserAuthority> authorities = new HashSet<>();
    @Column(name = "create_time", nullable = false)
    private Instant createTime;
    @Column(name = "update_time", nullable = false)
    private Instant updateTime;

    @Override
    public Set<ServerUserAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return active;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return active;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
