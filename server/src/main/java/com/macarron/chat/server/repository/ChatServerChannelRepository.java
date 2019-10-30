package com.macarron.chat.server.repository;

import com.macarron.chat.server.model.ChatServerChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatServerChannelRepository extends JpaRepository<ChatServerChannel, Long> {
    List<ChatServerChannel> findByServer_Id(long serverId);
}
