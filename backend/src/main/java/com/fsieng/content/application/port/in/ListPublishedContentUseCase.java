package com.fsieng.content.application.port.in;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Track;
import java.util.List;

public interface ListPublishedContentUseCase {

  /** Items of one track that learners may see: publishable license and reviewed. */
  List<ContentItem> listPublished(Track track);
}
