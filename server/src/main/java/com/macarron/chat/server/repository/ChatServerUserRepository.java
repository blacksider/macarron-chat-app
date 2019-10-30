package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ChatServerUserGroup;
import com.macarron.chat.server.model.ServerUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatServerUserRepository extends JpaRepository<ChatServerUser, Long> {
    @Query("select distinct(svu.userGroup.server) from ChatServerUser svu where svu.user=?1")
    List<ChatServer> getUserBelongServers(final ServerUser user);

    List<ChatServerUser> findByUserGroup(final ChatServerUserGroup group);
}
