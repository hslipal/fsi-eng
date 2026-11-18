package com.fsieng.content.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.Test;

class ContentItemTest {

  private static ContentItem item(License license, @Nullable String reviewedBy) {
    return new ContentItem(
        new ContentItemId(UUID.randomUUID()),
        Track.BUSINESS,
        "Asking for a quote",
        null,
        license,
        "ILR 2",
        reviewedBy);
  }

  @Test
  void reviewedPublishableItemIsPublishable() {
    assertThat(item(new License.Generated("deepseek"), "admin").isPublishable()).isTrue();
  }

  @Test
  void devOnlyItemIsNeverPublishableEvenWhenReviewed() {
    assertThat(item(new License.DevOnly(), "admin").isPublishable()).isFalse();
  }

  @Test
  void unreviewedItemIsNotPublishable() {
    assertThat(item(new License.Generated("deepseek"), null).isPublishable()).isFalse();
    assertThat(item(new License.Generated("deepseek"), " ").isPublishable()).isFalse();
  }

  @Test
  void titleAndLevelMustNotBeBlank() {
    ContentItemId id = new ContentItemId(UUID.randomUUID());
    License license = new License.DevOnly();
    assertThatThrownBy(() -> new ContentItem(id, Track.IT, " ", null, license, "ILR 2", null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new ContentItem(id, Track.IT, "Title", null, license, "", null))
        .isInstanceOf(InvalidContentException.class);
  }
}
