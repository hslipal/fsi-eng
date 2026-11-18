package com.fsieng.assessment.domain;

/** A transcribed speaking answer to one question of IELTS Speaking Part 1, 2 or 3. */
public record SpeakingSubmission(int part, String question, String transcript) {

  public SpeakingSubmission {
    if (part < 1 || part > 3) {
      throw new InvalidAssessmentException("speaking part must be 1, 2 or 3");
    }
    if (question.isBlank() || question.length() > 1_000) {
      throw new InvalidAssessmentException("the question must be 1-1000 characters");
    }
    if (transcript.isBlank()) {
      throw new InvalidAssessmentException("no speech was recognised in the recording");
    }
  }
}
