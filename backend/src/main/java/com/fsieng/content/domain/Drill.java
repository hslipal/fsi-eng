package com.fsieng.content.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/** One exercise inside a content item: a dialogue to memorise or a pattern drill. */
public sealed interface Drill permits Drill.Dialogue, Drill.PatternDrill {

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

  /** One cue and every answer we accept for it. */
  record Item(String cue, List<String> answers) {
    public Item {
      requireText(cue, "drill cue");
      if (answers.isEmpty()) {
        throw new InvalidContentException("drill item '" + cue + "' needs at least one answer");
      }
      answers.forEach(answer -> requireText(answer, "drill answer"));
      answers = List.copyOf(answers);
    }
  }

  private static void requireText(String value, String what) {
    if (value.isBlank()) {
      throw new InvalidContentException(what + " must not be blank");
    }
  }
}
