package com.fsieng.content.application.port.out;

import com.fsieng.content.domain.ContentItem;
import java.util.List;

public interface SaveContentPort {

  /** Inserts new items and replaces existing ones with the same id. */
  void saveAll(List<ContentItem> items);
}
