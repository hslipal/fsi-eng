package com.fsieng.practice.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * One auto-gradable question: a cue plus every answer we accept. Reading questions also carry their
 * passage and the options to choose from; items of a chained drill carry the sentence they build on
 * ({@code base}).
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
    List<String> answers,
    @Nullable String base,
    Translations translations) {

  public PracticeItem {
    if (answers.isEmpty()) {
      throw new InvalidPracticeException("practice item " + key.value() + " has no answers");
    }
    options = List.copyOf(options);
    answers = List.copyOf(answers);
  }

  /** An item without translations. */
  public PracticeItem(
      CardKey key,
      String title,
      String type,
      String instruction,
      @Nullable String model,
      @Nullable String passage,
      String cue,
      List<String> options,
      List<String> answers,
      @Nullable String base) {
    this(
        key,
        title,
        type,
        instruction,
        model,
        passage,
        cue,
        options,
        answers,
        base,
        Translations.NONE);
  }

  /** An item that does not build on a previous sentence. */
  public PracticeItem(
      CardKey key,
      String title,
      String type,
      String instruction,
      @Nullable String model,
      @Nullable String passage,
      String cue,
      List<String> options,
      List<String> answers) {
    this(key, title, type, instruction, model, passage, cue, options, answers, null);
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
    this(key, title, type, instruction, model, null, cue, List.of(), answers, null);
  }
}
