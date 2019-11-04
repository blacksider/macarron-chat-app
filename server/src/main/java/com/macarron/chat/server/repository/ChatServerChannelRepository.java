package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ChatServer;
import com.macarron.chat.server.model.ChatServerChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatServerChannelRepository extends JpaRepository<ChatServerChannel, Long> {
    List<ChatServerChannel> findByServerIn(final List<ChatServer> servers);

    List<ChatServerChannel> findByServer_Id(long serverId);

    void deleteByServer(final ChatServer server);

    boolean existsByServerAndChannelName(final ChatServer server, String name);

    long countByServer(final ChatServer server);
}
