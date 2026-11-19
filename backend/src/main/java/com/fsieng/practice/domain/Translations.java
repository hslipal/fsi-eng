package com.fsieng.practice.domain;

import org.jspecify.annotations.Nullable;

/**
 * Chinese translations shown alongside a question, each optional: of the model sentence, of the
 * sentence a chained item builds on, of the cue (when it is a sentence) and of the model answer.
 */
public record Translations(
    @Nullable String model, @Nullable String base, @Nullable String cue, @Nullable String answer) {

  public static final Translations NONE = new Translations(null, null, null, null);
}
