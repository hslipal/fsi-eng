package com.fsieng.content.application.service;

import com.fsieng.content.application.port.in.ListPracticeContentUseCase;
import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import java.util.List;

public final class ContentService
    implements ListPublishedContentUseCase, ListPracticeContentUseCase {

  private final LoadContentPort loadContentPort;
  private final boolean includeDevOnly;

  /**
   * @param includeDevOnly practice also uses dev-only (copyrighted, unlicensed) items; only the
   *     "dev" profile sets this
   */
  public ContentService(LoadContentPort loadContentPort, boolean includeDevOnly) {
    this.loadContentPort = loadContentPort;
    this.includeDevOnly = includeDevOnly;
  }

  public ContentService(LoadContentPort loadContentPort) {
    this(loadContentPort, false);
  }

  @Override
  public List<ContentItem> listPublished(Track track) {
    return loadContentPort.loadByTrack(track).stream().filter(ContentItem::isPublishable).toList();
  }

  @Override
  public List<ContentItem> listForPractice(Track track) {
    return loadContentPort.loadByTrack(track).stream().filter(this::isPracticable).toList();
  }

  private boolean isPracticable(ContentItem item) {
    return item.isPublishable() || (includeDevOnly && item.license() instanceof License.DevOnly);
  }
}
