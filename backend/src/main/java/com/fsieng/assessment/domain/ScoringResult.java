package com.fsieng.assessment.domain;

import java.util.List;

/** What the scoring model returned, after parsing: one score per criterion and a summary. */
public record ScoringResult(List<CriterionScore> criteria, String summary) {

  public ScoringResult {
    criteria = List.copyOf(criteria);
  }
}
