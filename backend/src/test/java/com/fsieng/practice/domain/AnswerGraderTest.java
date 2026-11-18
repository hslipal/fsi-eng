package com.fsieng.practice.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class AnswerGraderTest {

  private final AnswerGrader grader = new AnswerGrader();
  private final List<String> accepted =
      List.of(
          "I'm afraid the price is a little higher than we expected.",
          "We were hoping for a price closer to our budget.");

  @Test
  void ignoresCaseSpacingCurlyQuotesAndFinalPunctuation() {
    Grade grade =
        grader.grade("  i’m AFRAID the price is a little   higher than we expected", accepted);

    assertThat(grade.verdict()).isEqualTo(Verdict.CORRECT);
    assertThat(grade.expected()).isEqualTo(accepted.getFirst());
  }

  @Test
  void aTypingSlipIsClose() {
    Grade grade = grader.grade("We were hopping for a price closer to our budget.", accepted);

    assertThat(grade.verdict()).isEqualTo(Verdict.CLOSE);
    assertThat(grade.expected()).isEqualTo(accepted.get(1));
  }

  @Test
  void aDifferentSentenceIsWrongAndShowsTheClosestAnswer() {
    Grade grade = grader.grade("Your price is too high.", accepted);

    assertThat(grade.verdict()).isEqualTo(Verdict.WRONG);
    assertThat(accepted).contains(grade.expected());
  }

  @Test
  void shortAnswersAllowOneSlip() {
    assertThat(grader.grade("Fix the bug", List.of("Fix the bug")).verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(grader.grade("Fix teh bug", List.of("Fix the bug")).verdict())
        .isEqualTo(Verdict.WRONG);
    assertThat(grader.grade("Fix th bug", List.of("Fix the bug")).verdict())
        .isEqualTo(Verdict.CLOSE);
  }

  @Test
  void needsSomethingToGradeAgainst() {
    assertThatThrownBy(() -> grader.grade("x", List.of()))
        .isInstanceOf(InvalidPracticeException.class);
  }

  @Test
  void distanceIsLevenshtein() {
    assertThat(AnswerGrader.distance("kitten", "sitting")).isEqualTo(3);
    assertThat(AnswerGrader.distance("", "abc")).isEqualTo(3);
    assertThat(AnswerGrader.distance("same", "same")).isZero();
  }

  @Test
  void verdictCodesMatchTheApi() {
    assertThat(Verdict.CORRECT.code()).isEqualTo("correct");
    assertThat(Verdict.CLOSE.code()).isEqualTo("close");
    assertThat(Verdict.WRONG.code()).isEqualTo("wrong");
  }
}
