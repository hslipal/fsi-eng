package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.PracticeItem;
import org.jspecify.annotations.Nullable;

/** A question without its answers. Mirrors frontend CardSchema; see docs/api-contract.md. */
public record CardResponse(
    String cardKey,
    String title,
    String type,
    String instruction,
    @Nullable String model,
    String cue) {

  static CardResponse from(PracticeItem item) {
    return new CardResponse(
        item.key().value(),
        item.title(),
        item.type(),
        item.instruction(),
        item.model(),
        item.cue());
  }
}
