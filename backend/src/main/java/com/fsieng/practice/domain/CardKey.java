package com.fsieng.practice.domain;

import java.util.UUID;

/** Identifies one drill item: content item id, drill index and item index. */
public record CardKey(String value) {

  public CardKey {
    if (value.isBlank()) {
      throw new InvalidPracticeException("card key must not be blank");
    }
  }

  public static CardKey of(UUID contentId, int drillIndex, int itemIndex) {
    return new CardKey(contentId + ":" + drillIndex + ":" + itemIndex);
  }
}
