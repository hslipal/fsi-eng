package com.fsieng.content.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ContentServiceTest {

  private static ContentItem item(String title, License license) {
    return new ContentItem(
        new ContentItemId(UUID.randomUUID()), Track.IELTS, title, null, license, "6.5", "admin");
  }

  @Test
  void returnsOnlyPublishableItems() {
    ContentItem generated = item("Original essay prompt", new License.Generated("deepseek"));
    ContentItem pastPaper = item("Cambridge past paper", new License.DevOnly());
    ContentService service = new ContentService(_ -> List.of(generated, pastPaper));

    assertThat(service.listPublished(Track.IELTS)).containsExactly(generated);
  }
}
