package com.fsieng.assessment.domain;

public enum WritingTask {
  TASK_1("task-1", 150),
  TASK_2("task-2", 250);

  private final String code;
  private final int recommendedWords;

  WritingTask(String code, int recommendedWords) {
    this.code = code;
    this.recommendedWords = recommendedWords;
  }

  public String code() {
    return code;
  }

  public int recommendedWords() {
    return recommendedWords;
  }

  public static WritingTask fromCode(String code) {
    for (WritingTask task : values()) {
      if (task.code.equals(code)) {
        return task;
      }
    }
    throw new InvalidAssessmentException("unknown writing task: " + code);
  }
}
