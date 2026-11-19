package com.fsieng.practice.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class LessonTest {

  private static PracticeItem item(String type, int index) {
    return new PracticeItem(
        new CardKey("c:" + type + ":" + index),
        "Quote",
        type,
        "Do it.",
        null,
        "cue",
        List.of("Answer."));
  }

  @Test
  void ordersDrillsTheFsiWayAndKeepsContentOrderWithinADrill() {
    Lesson lesson =
        new Lesson(
            "id",
            "Quote",
            "ILR 1+",
            List.of(
                item("expansion", 0),
                item("translation", 0),
                item("transformation", 0),
                item("substitution", 0),
                item("substitution", 1),
                item("response", 0),
                item("reading", 0)));

    assertThat(lesson.items())
        .extracting(PracticeItem::key)
        .extracting(CardKey::value)
        .containsExactly(
            "c:substitution:0",
            "c:substitution:1",
            "c:transformation:0",
            "c:response:0",
            "c:expansion:0");
    assertThat(lesson.count("substitution")).isEqualTo(2);
    assertThat(lesson.count("translation")).isZero();
    assertThat(lesson.isEmpty()).isFalse();
  }

  @Test
  void aLessonWithoutPatternDrillsIsEmpty() {
    assertThat(new Lesson("id", "Reading", "Band 6", List.of(item("reading", 0))).isEmpty())
        .isTrue();
  }

  @Test
  void needsAnIdAndATitle() {
    assertThatThrownBy(() -> new Lesson(" ", "Quote", "ILR 1", List.of()))
        .isInstanceOf(InvalidPracticeException.class);
    assertThatThrownBy(() -> new Lesson("id", "", "ILR 1", List.of()))
        .isInstanceOf(InvalidPracticeException.class);
  }
}
