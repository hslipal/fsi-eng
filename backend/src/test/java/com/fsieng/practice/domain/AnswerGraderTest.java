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

  @Test
  void choicesAreRightOrWrongNeverClose() {
    List<String> accepted = List.of("NOT GIVEN");

    assertThat(grader.gradeChoice("not given", accepted).verdict()).isEqualTo(Verdict.CORRECT);
    assertThat(grader.gradeChoice("B", List.of("A")).verdict()).isEqualTo(Verdict.WRONG);
    assertThat(grader.gradeChoice("B", List.of("A")).expected()).isEqualTo("A");
    assertThatThrownBy(() -> grader.gradeChoice("A", List.of()))
        .isInstanceOf(InvalidPracticeException.class);
  }

  @Test
  void spokenAnswersWithoutCommasOrWithContractionsWrittenOutAreCorrect() {
    List<String> answers =
        List.of("Because of a customs inspection, the shipment will arrive on 12 March.");
    assertThat(
            grader
                .grade(
                    "because of a customs inspection the shipment will arrive on 12 March", answers)
                .verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(
            grader
                .grade("I am afraid the price is a little higher than we expected", accepted)
                .verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(grader.grade("Do not smoke so often!", List.of("Don't smoke so often!")).verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(grader.grade("We cannot ship it.", List.of("We can't ship it.")).verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(grader.grade("It will not work.", List.of("It won't work.")).verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(
            grader
                .grade(
                    "They are here and we have been told.",
                    List.of("They're here and we've been told."))
                .verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(grader.grade("We will call you.", List.of("We'll call you.")).verdict())
        .isEqualTo(Verdict.CORRECT);
  }

  @Test
  void ambiguousContractionsAreNotExpanded() {
    assertThat(AnswerGrader.normalize("He's here, she'd go.")).isEqualTo("he's here she'd go");
  }
}
