package com.fsieng.assessment.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.assessment.application.port.out.ScoringPort;
import com.fsieng.assessment.domain.Assessment;
import com.fsieng.assessment.domain.AudioClip;
import com.fsieng.assessment.domain.Criterion;
import com.fsieng.assessment.domain.CriterionScore;
import com.fsieng.assessment.domain.EstimatedBand;
import com.fsieng.assessment.domain.ScoringResult;
import com.fsieng.assessment.domain.Skill;
import com.fsieng.assessment.domain.SpeakingSubmission;
import com.fsieng.assessment.domain.WritingSubmission;
import com.fsieng.assessment.domain.WritingTask;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class AssessmentServiceTest {

  private final List<SpeakingSubmission> spoken = new ArrayList<>();

  private static ScoringResult result(Skill skill, double band) {
    return new ScoringResult(
        Criterion.scoredFor(skill).stream()
            .map(criterion -> new CriterionScore(criterion, new EstimatedBand(band), "ok"))
            .toList(),
        "summary");
  }

  private final ScoringPort scoring =
      new ScoringPort() {
        @Override
        public ScoringResult scoreWriting(WritingSubmission submission) {
          return result(Skill.WRITING, 6.5);
        }

        @Override
        public ScoringResult scoreSpeaking(SpeakingSubmission submission) {
          spoken.add(submission);
          return result(Skill.SPEAKING, 6);
        }
      };

  private final AssessmentService service =
      new AssessmentService(scoring, _ -> "I work from home on Fridays.");

  @Test
  void writingIsScoredWithoutATranscript() {
    Assessment assessment =
        service.assessWriting(
            new WritingSubmission(WritingTask.TASK_2, "Discuss.", "word ".repeat(30)));

    assertThat(assessment.skill()).isEqualTo(Skill.WRITING);
    assertThat(assessment.overall()).isEqualTo(new EstimatedBand(6.5));
    assertThat(assessment.transcript()).isNull();
  }

  @Test
  void speakingIsTranscribedThenScored() {
    Assessment assessment =
        service.assessSpeaking(1, "Do you work from home?", new AudioClip(new byte[] {1}, "a.wav"));

    assertThat(assessment.transcript()).isEqualTo("I work from home on Fridays.");
    assertThat(spoken)
        .containsExactly(
            new SpeakingSubmission(1, "Do you work from home?", "I work from home on Fridays."));
    assertThat(assessment.criteria()).hasSize(3);
  }
}
