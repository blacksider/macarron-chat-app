package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerUser;
import com.macarron.chat.server.model.ChatServerUserGroup;
import com.macarron.chat.server.model.ServerUser;
import org.apache.catalina.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatServerUserRepository extends JpaRepository<ChatServerUser, Long> {
    @Query("select distinct(svu.userGroup.server) from ChatServerUser svu where svu.user=?1")
    List<ChatServer> getUserBelongServers(final ServerUser user);

    @Query("select distinct(svu.user) from ChatServerUser svu where svu.userGroup.server=?1")
    List<ServerUser> getServerUsers(final ChatServer server);

    @Query("select distinct(svu.user.email) from ChatServerUser svu where svu.userGroup.server.id=?1")
    List<String> getUserEmailsByServerId(long serverId);

    @Query("select svu from ChatServerUser svu where svu.userGroup.server.id=?1 and svu.user = ?2")
    ChatServerUser getUserByServerId(long serverId, final ServerUser user);

    List<ChatServerUser> findByUserGroup(final ChatServerUserGroup group);

    @Query("select count(svu) from ChatServerUser svu where svu.user.email=?1 and svu.userGroup.server.id=?2")
    long countByUserEmailAndUserGroupServerId(final String userEmail, long serverId);

    void deleteByUserGroup_Server(final ChatServer server);
}
