package com.fsieng.practice.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

/** {@code slow}: the learner missed the time limit of a timed drill (optional, default false). */
public record AnswerRequest(
    @NotBlank String cardKey, @NotBlank @Size(max = 1000) String answer, @Nullable Boolean slow) {

  public AnswerRequest(String cardKey, String answer) {
    this(cardKey, answer, null);
  }

  boolean isSlow() {
    return Boolean.TRUE.equals(slow);
  }
}
