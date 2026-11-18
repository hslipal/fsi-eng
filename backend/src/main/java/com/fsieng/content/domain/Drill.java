package com.fsieng.content.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/** One exercise inside a content item: a dialogue to memorise or a pattern drill. */
public sealed interface Drill
    permits Drill.Dialogue, Drill.PatternDrill, Drill.Reading, Drill.Speaking {

  /** FSI basic dialogue: learners listen, repeat and memorise it line by line. */
  record Dialogue(List<Line> lines) implements Drill {
    public Dialogue {
      if (lines.isEmpty()) {
        throw new InvalidContentException("a dialogue needs at least one line");
      }
      lines = List.copyOf(lines);
    }
  }

  /** A spoken or written line of a dialogue. */
  record Line(String speaker, String text) {
    public Line {
      requireText(speaker, "dialogue speaker");
      requireText(text, "dialogue text");
    }
  }

  /** Substitution, transformation, expansion, translation or response drill. */
  record PatternDrill(DrillType type, String instruction, @Nullable String model, List<Item> items)
      implements Drill {
    public PatternDrill {
      requireText(instruction, "drill instruction");
      if (items.isEmpty()) {
        throw new InvalidContentException("a " + type.code() + " drill needs at least one item");
      }
      items = List.copyOf(items);
    }
  }

  /**
   * IELTS-style reading: a passage and closed questions (TRUE / FALSE / NOT GIVEN, multiple
   * choice). Each item lists its options; the answer must be one of them.
   */
  record Reading(String instruction, String passage, List<Item> items) implements Drill {
    public Reading {
      requireText(instruction, "reading instruction");
      requireText(passage, "reading passage");
      if (items.isEmpty()) {
        throw new InvalidContentException("a reading drill needs at least one question");
      }
      for (Item item : items) {
        if (item.options().isEmpty()) {
          throw new InvalidContentException("reading question '" + item.cue() + "' needs options");
        }
      }
      items = List.copyOf(items);
    }
  }

  /** IELTS speaking questions, each optionally with a recorded sample answer. Not auto-graded. */
  record Speaking(String instruction, List<SpeakingPrompt> prompts) implements Drill {
    public Speaking {
      requireText(instruction, "speaking instruction");
      if (prompts.isEmpty()) {
        throw new InvalidContentException("a speaking drill needs at least one question");
      }
      prompts = List.copyOf(prompts);
    }
  }

  /**
   * One speaking question. {@code audio} is a sample answer: a path relative to the content root
   * (content/ or content-dev/), e.g. "ielts/speaking-audio/q1.mp3"; no "..", no absolute paths.
   */
  record SpeakingPrompt(
      String question, int part, @Nullable String audio, @Nullable Double seconds) {
    public SpeakingPrompt {
      requireText(question, "speaking question");
      if (part < 1 || part > 3) {
        throw new InvalidContentException("speaking part must be 1, 2 or 3");
      }
      if (audio != null && !isSafeRelativePath(audio)) {
        throw new InvalidContentException("unsafe audio path: " + audio);
      }
    }
  }

  /** A relative path that cannot leave its folder. */
  static boolean isSafeRelativePath(String path) {
    if (path.isBlank() || path.startsWith("/") || path.startsWith("\\") || path.contains(":")) {
      return false;
    }
    for (String segment : path.split("[/\\\\]")) {
      if (segment.equals("..")) {
        return false;
      }
    }
    return true;
  }

  /**
   * One cue and every answer we accept for it. Closed questions also list their options; each
   * accepted answer must then be one of the options.
   */
  record Item(String cue, List<String> answers, List<String> options) {
    public Item {
      requireText(cue, "drill cue");
      if (answers.isEmpty()) {
        throw new InvalidContentException("drill item '" + cue + "' needs at least one answer");
      }
      answers.forEach(answer -> requireText(answer, "drill answer"));
      options.forEach(option -> requireText(option, "drill option"));
      if (!options.isEmpty() && !options.containsAll(answers)) {
        throw new InvalidContentException(
            "drill item '" + cue + "' has an answer that is not an option");
      }
      answers = List.copyOf(answers);
      options = List.copyOf(options);
    }

    /** An open item: the learner types the answer. */
    public Item(String cue, List<String> answers) {
      this(cue, answers, List.of());
    }
  }

  private static void requireText(String value, String what) {
    if (value.isBlank()) {
      throw new InvalidContentException(what + " must not be blank");
    }
  }
}
