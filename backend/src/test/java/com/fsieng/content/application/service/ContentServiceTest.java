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
        new ContentItemId(UUID.randomUUID()),
        Track.IELTS,
        title,
        null,
        license,
        "6.5",
        "admin",
        List.of());
  }

  @Test
  void returnsOnlyPublishableItems() {
    ContentItem generated = item("Original essay prompt", new License.Generated("deepseek"));
    ContentItem pastPaper = item("Cambridge past paper", new License.DevOnly());
    ContentService service = new ContentService(_ -> List.of(generated, pastPaper));

    assertThat(service.listPublished(Track.IELTS)).containsExactly(generated);
    assertThat(service.listForPractice(Track.IELTS)).containsExactly(generated);
  }

  @Test
  void practiceUsesDevOnlyItemsOnlyWhenSwitchedOn() {
    ContentItem generated = item("Original essay prompt", new License.Generated("deepseek"));
    ContentItem book = item("Business letters book", new License.DevOnly());
    ContentService dev = new ContentService(_ -> List.of(generated, book), true);

    assertThat(dev.listForPractice(Track.IELTS)).containsExactly(generated, book);
    assertThat(dev.listPublished(Track.IELTS)).containsExactly(generated);
  }
}
