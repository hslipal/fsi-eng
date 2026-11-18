package com.fsieng.content.adapter.out.persistence;

import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Track;
import java.util.List;

public class ContentPersistenceAdapter implements LoadContentPort {

  private final ContentItemJpaRepository repository;

  public ContentPersistenceAdapter(ContentItemJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<ContentItem> loadByTrack(Track track) {
    return repository.findByTrackOrderByTitle(track.code()).stream()
        .map(ContentEntityMapper::toDomain)
        .toList();
  }
}
