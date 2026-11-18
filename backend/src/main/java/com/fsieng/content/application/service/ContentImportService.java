package com.fsieng.content.application.service;

import com.fsieng.content.application.port.in.ImportContentUseCase;
import com.fsieng.content.application.port.out.ReadContentFilesPort;
import com.fsieng.content.application.port.out.SaveContentPort;
import com.fsieng.content.domain.ContentImportReport;
import com.fsieng.content.domain.ContentItem;
import java.util.List;

public final class ContentImportService implements ImportContentUseCase {

  private final ReadContentFilesPort files;
  private final SaveContentPort store;

  public ContentImportService(ReadContentFilesPort files, SaveContentPort store) {
    this.files = files;
    this.store = store;
  }

  @Override
  public ContentImportReport importAll() {
    List<ContentItem> items = files.readAll();
    store.saveAll(items);
    int published = (int) items.stream().filter(ContentItem::isPublishable).count();
    return new ContentImportReport(items.size(), published);
  }
}
