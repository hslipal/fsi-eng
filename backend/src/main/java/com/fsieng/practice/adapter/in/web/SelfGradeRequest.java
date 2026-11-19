package com.fsieng.practice.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

/** The learner's own verdict: "correct", "close" or "wrong"; {@code slow} as for answers. */
public record SelfGradeRequest(
    @NotBlank String cardKey, @NotBlank String verdict, @Nullable Boolean slow) {

  boolean isSlow() {
    return Boolean.TRUE.equals(slow);
  }
}
