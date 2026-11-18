package com.fsieng.content.adapter.in.web;

import com.fsieng.content.domain.SpeakingPromptRef;
import org.jspecify.annotations.Nullable;

/** Mirrors frontend SpeakingPromptSchema; see docs/api-contract.md. */
public record SpeakingPromptResponse(
    String key,
    int part,
    String question,
    boolean hasSample,
    @Nullable Double sampleSeconds,
    boolean devOnly) {

  static SpeakingPromptResponse from(SpeakingPromptRef ref) {
    return new SpeakingPromptResponse(
        ref.key(), ref.part(), ref.question(), ref.hasSample(), ref.sampleSeconds(), ref.devOnly());
  }
}
