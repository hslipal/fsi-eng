package com.fsieng.practice.domain;

import java.util.Comparator;
import java.util.List;

/**
 * One content item practised the FSI way: its pattern drills in a fixed order (substitution,
 * transformation, response, expansion), each drill's items in content order. Translation and
 * reading questions are not part of a lesson; they stay in the review queue. {@code devOnly}: built
 * from copyrighted, unlicensed material for development; never published.
 */
public record Lesson(
    String id, String title, String level, List<PracticeItem> items, boolean devOnly) {

  /** The drill types of a lesson, in the order they are practised. */
  public static final List<String> ORDER =
      List.of("substitution", "transformation", "response", "expansion");

  public Lesson {
    if (id.isBlank() || title.isBlank()) {
      throw new InvalidPracticeException("a lesson needs an id and a title");
    }
    items =
        items.stream()
            .filter(item -> ORDER.contains(item.type()))
            .sorted(Comparator.comparingInt(item -> ORDER.indexOf(item.type())))
            .toList();
  }

  /** A lesson from published material. */
  public Lesson(String id, String title, String level, List<PracticeItem> items) {
    this(id, title, level, items, false);
  }

  public boolean isEmpty() {
    return items.isEmpty();
  }

  /** How many items the lesson has of the given type. */
  public long count(String type) {
    return items.stream().filter(item -> item.type().equals(type)).count();
  }
}
