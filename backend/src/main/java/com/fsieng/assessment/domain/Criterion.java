package com.fsieng.assessment.domain;

import java.util.List;

/** The four public IELTS assessment criteria per skill. */
public enum Criterion {
  TASK_RESPONSE("task-response"),
  COHERENCE_COHESION("coherence-cohesion"),
  FLUENCY_COHERENCE("fluency-coherence"),
  LEXICAL_RESOURCE("lexical-resource"),
  GRAMMATICAL_RANGE_ACCURACY("grammatical-range-accuracy"),
  PRONUNCIATION("pronunciation");

  private final String code;

  Criterion(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }

  public static Criterion fromCode(String code) {
    for (Criterion criterion : values()) {
      if (criterion.code.equals(code)) {
        return criterion;
      }
    }
    throw new InvalidAssessmentException("unknown criterion: " + code);
  }

  /**
   * Criteria we score for a skill. Pronunciation is not among them: speech-to-text keeps the words
   * but not the sound, so it cannot be estimated.
   */
  public static List<Criterion> scoredFor(Skill skill) {
    return switch (skill) {
      case WRITING ->
          List.of(TASK_RESPONSE, COHERENCE_COHESION, LEXICAL_RESOURCE, GRAMMATICAL_RANGE_ACCURACY);
      case SPEAKING -> List.of(FLUENCY_COHERENCE, LEXICAL_RESOURCE, GRAMMATICAL_RANGE_ACCURACY);
    };
  }
}
