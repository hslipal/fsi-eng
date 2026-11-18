package com.fsieng.assessment.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class AssessmentTest {

  private static CriterionScore score(Criterion criterion, double band) {
    return new CriterionScore(criterion, new EstimatedBand(band), "comment");
  }

  @Test
  void computesTheOverallBandFromTheCriteria() {
    ScoringResult result =
        new ScoringResult(
            List.of(
                score(Criterion.TASK_RESPONSE, 6),
                score(Criterion.COHERENCE_COHESION, 6.5),
                score(Criterion.LEXICAL_RESOURCE, 6),
                score(Criterion.GRAMMATICAL_RANGE_ACCURACY, 5.5)),
            "summary");

    Assessment assessment = Assessment.of(Skill.WRITING, result, null);

    assertThat(assessment.overall()).isEqualTo(new EstimatedBand(6.0));
    assertThat(assessment.pronunciationScored()).isFalse();
  }

  @Test
  void rejectsMissingDuplicatedOrForeignCriteria() {
    ScoringResult missing =
        new ScoringResult(List.of(score(Criterion.TASK_RESPONSE, 6)), "summary");
    ScoringResult duplicated =
        new ScoringResult(
            List.of(
                score(Criterion.FLUENCY_COHERENCE, 6),
                score(Criterion.LEXICAL_RESOURCE, 6),
                score(Criterion.GRAMMATICAL_RANGE_ACCURACY, 6),
                score(Criterion.LEXICAL_RESOURCE, 7)),
            "summary");
    ScoringResult pronunciation =
        new ScoringResult(
            List.of(
                score(Criterion.FLUENCY_COHERENCE, 6),
                score(Criterion.LEXICAL_RESOURCE, 6),
                score(Criterion.PRONUNCIATION, 6)),
            "summary");

    assertThatThrownBy(() -> Assessment.of(Skill.WRITING, missing, null))
        .isInstanceOf(ScoringUnavailableException.class);
    assertThatThrownBy(() -> Assessment.of(Skill.SPEAKING, duplicated, "t"))
        .isInstanceOf(ScoringUnavailableException.class);
    assertThatThrownBy(() -> Assessment.of(Skill.SPEAKING, pronunciation, "t"))
        .isInstanceOf(ScoringUnavailableException.class);
  }

  @Test
  void codesRoundTrip() {
    for (Criterion criterion : Criterion.values()) {
      assertThat(Criterion.fromCode(criterion.code())).isEqualTo(criterion);
    }
    for (WritingTask task : WritingTask.values()) {
      assertThat(WritingTask.fromCode(task.code())).isEqualTo(task);
    }
    assertThatThrownBy(() -> Criterion.fromCode("vibes"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(() -> WritingTask.fromCode("task-3"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThat(Criterion.scoredFor(Skill.SPEAKING)).doesNotContain(Criterion.PRONUNCIATION);
  }
}
