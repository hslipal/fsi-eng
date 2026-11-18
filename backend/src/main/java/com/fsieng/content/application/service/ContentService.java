package com.fsieng.content.application.service;

import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Track;
import java.util.List;

public final class ContentService implements ListPublishedContentUseCase {

  private final LoadContentPort loadContentPort;

  public ContentService(LoadContentPort loadContentPort) {
    this.loadContentPort = loadContentPort;
  }

  @Override
  public List<ContentItem> listPublished(Track track) {
    return loadContentPort.loadByTrack(track).stream().filter(ContentItem::isPublishable).toList();
  }
}
