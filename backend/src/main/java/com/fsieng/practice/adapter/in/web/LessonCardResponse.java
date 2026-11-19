package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.PracticeItem;
import org.jspecify.annotations.Nullable;

/**
 * A lesson question with its model answer: in FSI tape style the learner hears the model answer
 * after answering aloud. Mirrors frontend LessonCardSchema; see docs/api-contract.md.
 */
public record LessonCardResponse(
    String cardKey,
    String type,
    String instruction,
    @Nullable String model,
    String cue,
    @Nullable String base,
    String answer) {

  static LessonCardResponse from(PracticeItem item) {
    return new LessonCardResponse(
        item.key().value(),
        item.type(),
        item.instruction(),
        item.model(),
        item.cue(),
        item.base(),
        item.answers().getFirst());
  }
}
