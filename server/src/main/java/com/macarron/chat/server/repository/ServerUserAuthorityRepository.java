package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ServerUserAuthority;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerUserAuthorityRepository extends JpaRepository<ServerUserAuthority, Long> {
}
