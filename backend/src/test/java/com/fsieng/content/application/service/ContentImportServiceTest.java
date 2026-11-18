package com.fsieng.content.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.domain.ContentImportReport;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.Test;

class ContentImportServiceTest {

  private static ContentItem item(@Nullable String reviewedBy) {
    return new ContentItem(
        new ContentItemId(UUID.randomUUID()),
        Track.BUSINESS,
        "Asking for a quote",
        null,
        new License.Generated("claude"),
        "ILR 2",
        reviewedBy,
        List.of());
  }

  @Test
  void storesEveryFileAndCountsThePublishedOnes() {
    List<ContentItem> files = List.of(item("admin"), item(null));
    List<ContentItem> stored = new ArrayList<>();
    ContentImportService service = new ContentImportService(() -> files, stored::addAll);

    ContentImportReport report = service.importAll();

    assertThat(stored).isEqualTo(files);
    assertThat(report).isEqualTo(new ContentImportReport(2, 1));
  }
}
