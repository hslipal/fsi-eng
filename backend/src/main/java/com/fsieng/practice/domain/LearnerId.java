package com.fsieng.practice.domain;

/** Who is practising. Authentication comes later; until then the web layer passes an id. */
public record LearnerId(String value) {

  public LearnerId {
    if (value.isBlank() || value.length() > 100) {
      throw new InvalidPracticeException("learner id must be 1-100 characters");
    }
  }
}
