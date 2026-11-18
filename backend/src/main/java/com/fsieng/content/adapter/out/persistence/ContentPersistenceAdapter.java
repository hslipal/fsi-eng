package com.fsieng.content.adapter.out.persistence;

import com.fsieng.content.adapter.out.json.DrillJsonCodec;
import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.application.port.out.SaveContentPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Track;
import java.util.List;

public class ContentPersistenceAdapter implements LoadContentPort, SaveContentPort {

  private final ContentItemJpaRepository repository;
  private final ContentEntityMapper mapper;

  public ContentPersistenceAdapter(ContentItemJpaRepository repository, DrillJsonCodec drills) {
    this.repository = repository;
    this.mapper = new ContentEntityMapper(drills);
  }

  @Override
  public List<ContentItem> loadByTrack(Track track) {
    return repository.findByTrackOrderByTitle(track.code()).stream().map(mapper::toDomain).toList();
  }

  @Override
  public void saveAll(List<ContentItem> items) {
    repository.saveAll(items.stream().map(mapper::toEntity).toList());
  }
}
