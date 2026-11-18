package com.fsieng.practice.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/** One auto-gradable question: a cue plus every answer we accept. */
public record PracticeItem(
    CardKey key,
    String title,
    String type,
    String instruction,
    @Nullable String model,
    String cue,
    List<String> answers) {

  public PracticeItem {
    if (answers.isEmpty()) {
      throw new InvalidPracticeException("practice item " + key.value() + " has no answers");
    }
    answers = List.copyOf(answers);
  }
}
