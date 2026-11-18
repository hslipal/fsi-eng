package com.fsieng.content.domain;

import org.jspecify.annotations.Nullable;

/** A speaking question as learners see it, addressed by {@code key}. */
public record SpeakingPromptRef(
    String key,
    int part,
    String question,
    boolean hasSample,
    @Nullable Double sampleSeconds,
    boolean devOnly) {}
