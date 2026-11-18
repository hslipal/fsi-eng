package com.fsieng.content.application.port.out;

import com.fsieng.content.domain.ContentItem;
import java.util.List;

public interface ReadContentFilesPort {

  /** Every content file outside the drafts folder, validated by the domain constructors. */
  List<ContentItem> readAll();
}
