package com.fsieng.content.domain;

import org.jspecify.annotations.Nullable;

/**
 * One piece of learning material. It reaches learners only when its license is publishable and an
 * admin has reviewed it.
 */
public record ContentItem(
    ContentItemId id,
    Track track,
    String title,
    @Nullable String sourceUrl,
    License license,
    String level,
    @Nullable String reviewedBy) {

  public ContentItem {
    if (title.isBlank()) {
      throw new InvalidContentException("title must not be blank");
    }
    if (level.isBlank()) {
      throw new InvalidContentException("level must not be blank");
    }
  }

  public boolean isPublishable() {
    return license.publishable() && reviewedBy != null && !reviewedBy.isBlank();
  }
}
