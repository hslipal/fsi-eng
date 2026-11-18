package com.fsieng.practice.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * One auto-gradable question: a cue plus every answer we accept. Reading questions also carry their
 * passage and the options to choose from.
 */
public record PracticeItem(
    CardKey key,
    String title,
    String type,
    String instruction,
    @Nullable String model,
    @Nullable String passage,
    String cue,
    List<String> options,
    List<String> answers) {

  public PracticeItem {
    if (answers.isEmpty()) {
      throw new InvalidPracticeException("practice item " + key.value() + " has no answers");
    }
    options = List.copyOf(options);
    answers = List.copyOf(answers);
  }

  /** A typed-answer item without passage or options. */
  public PracticeItem(
      CardKey key,
      String title,
      String type,
      String instruction,
      @Nullable String model,
      String cue,
      List<String> answers) {
    this(key, title, type, instruction, model, null, cue, List.of(), answers);
  }
}
