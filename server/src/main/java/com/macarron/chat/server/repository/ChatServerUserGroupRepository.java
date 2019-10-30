package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ChatServerUserGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatServerUserGroupRepository extends JpaRepository<ChatServerUserGroup, Long> {
    List<ChatServerUserGroup> findByServer_Id(long serverId);
}
