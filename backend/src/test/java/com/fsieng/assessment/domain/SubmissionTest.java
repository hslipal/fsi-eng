package com.fsieng.assessment.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SubmissionTest {

  private static final String TWENTY_WORDS = "word ".repeat(20);

  @Test
  void writingNeedsAPromptAndEnoughWords() {
    WritingSubmission ok = new WritingSubmission(WritingTask.TASK_2, "Discuss.", TWENTY_WORDS);
    assertThat(ok.words()).isEqualTo(20);

    assertThatThrownBy(() -> new WritingSubmission(WritingTask.TASK_2, "Discuss.", "too short"))
        .isInstanceOf(InvalidAssessmentException.class)
        .hasMessageContaining("20 words");
    assertThatThrownBy(() -> new WritingSubmission(WritingTask.TASK_2, " ", TWENTY_WORDS))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(
            () -> new WritingSubmission(WritingTask.TASK_1, "Describe.", "x".repeat(10_001)))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThat(WritingSubmission.wordCount("   ")).isZero();
  }

  @Test
  void speakingNeedsAValidPartQuestionAndTranscript() {
    assertThat(new SpeakingSubmission(2, "Describe a place.", "I like Hangzhou.").part())
        .isEqualTo(2);
    assertThatThrownBy(() -> new SpeakingSubmission(4, "q", "t"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(() -> new SpeakingSubmission(0, "q", "t"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(() -> new SpeakingSubmission(1, " ", "t"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(() -> new SpeakingSubmission(1, "q", " "))
        .isInstanceOf(InvalidAssessmentException.class)
        .hasMessageContaining("no speech");
  }

  @Test
  void audioClipsAreLimitedAndCopied() {
    byte[] bytes = {1, 2, 3};
    AudioClip clip = new AudioClip(bytes, "answer.wav");
    bytes[0] = 9;

    assertThat(clip.bytes()).containsExactly(1, 2, 3);
    assertThat(clip.size()).isEqualTo(3);
    assertThat(clip.filename()).isEqualTo("answer.wav");
    assertThatThrownBy(() -> new AudioClip(new byte[0], "a.wav"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(() -> new AudioClip(new byte[AudioClip.MAX_BYTES + 1], "a.wav"))
        .isInstanceOf(InvalidAssessmentException.class);
    assertThatThrownBy(() -> new AudioClip(new byte[1], " "))
        .isInstanceOf(InvalidAssessmentException.class);
  }
}
