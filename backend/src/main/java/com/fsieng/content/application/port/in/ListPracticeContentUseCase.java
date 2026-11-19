package com.fsieng.content.application.port.in;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Track;
import java.util.List;

public interface ListPracticeContentUseCase {

  /**
   * Items of one track to practise: the published ones and, only when dev-only material is switched
   * on (the "dev" profile), the dev-only ones from content-dev/.
   */
  List<ContentItem> listForPractice(Track track);
}
