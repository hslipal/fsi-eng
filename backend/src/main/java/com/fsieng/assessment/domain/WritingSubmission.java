package com.fsieng.assessment.domain;

/** An essay to estimate. Very short essays are rejected: there is nothing to score. */
public record WritingSubmission(WritingTask task, String prompt, String essay) {

  public static final int MIN_WORDS = 20;
  public static final int MAX_CHARS = 10_000;

  public WritingSubmission {
    if (prompt.isBlank() || prompt.length() > 2_000) {
      throw new InvalidAssessmentException("the task prompt must be 1-2000 characters");
    }
    if (essay.length() > MAX_CHARS) {
      throw new InvalidAssessmentException(
          "the essay must be at most " + MAX_CHARS + " characters");
    }
    if (wordCount(essay) < MIN_WORDS) {
      throw new InvalidAssessmentException("the essay needs at least " + MIN_WORDS + " words");
    }
  }

  public int words() {
    return wordCount(essay);
  }

  static int wordCount(String text) {
    String trimmed = text.strip();
    return trimmed.isEmpty() ? 0 : trimmed.split("\\s+").length;
  }
}
