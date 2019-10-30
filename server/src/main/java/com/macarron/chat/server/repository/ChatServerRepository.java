package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ChatServer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatServerRepository extends JpaRepository<ChatServer, Long> {
}
