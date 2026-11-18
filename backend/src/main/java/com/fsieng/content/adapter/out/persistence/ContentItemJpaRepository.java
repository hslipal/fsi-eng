package com.fsieng.content.adapter.out.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentItemJpaRepository extends JpaRepository<ContentItemEntity, UUID> {

  List<ContentItemEntity> findByTrackOrderByTitle(String track);
}
