package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.PracticeItem;
import org.jspecify.annotations.Nullable;

/**
 * A lesson question with its model answer: in FSI tape style the learner hears the model answer
 * after answering aloud. The translations are Chinese and optional. Mirrors frontend
 * LessonCardSchema; see docs/api-contract.md.
 */
public record LessonCardResponse(
    String cardKey,
    String type,
    String instruction,
    @Nullable String model,
    String cue,
    @Nullable String base,
    String answer,
    @Nullable String modelTranslation,
    @Nullable String baseTranslation,
    @Nullable String cueTranslation,
    @Nullable String answerTranslation) {

  static LessonCardResponse from(PracticeItem item) {
    return new LessonCardResponse(
        item.key().value(),
        item.type(),
        item.instruction(),
        item.model(),
        item.cue(),
        item.base(),
        item.answers().getFirst(),
        item.translations().model(),
        item.translations().base(),
        item.translations().cue(),
        item.translations().answer());
  }
}
