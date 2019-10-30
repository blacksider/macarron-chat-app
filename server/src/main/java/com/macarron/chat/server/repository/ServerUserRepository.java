package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ServerUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServerUserRepository extends JpaRepository<ServerUser, Long> {
    Optional<ServerUser> findByEmail(final String email);

    boolean existsByUsernameAndTag(final String username, final int tag);

    boolean existsByEmail(final String email);

    boolean existsByEmailAndIdNot(final String email, final long id);
}
