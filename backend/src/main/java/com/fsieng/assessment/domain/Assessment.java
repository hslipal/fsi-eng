package com.fsieng.assessment.domain;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;

/**
 * An AI-estimated assessment. The overall band is computed here from the criteria, never taken from
 * the model. Pronunciation is never scored.
 */
public record Assessment(
    Skill skill,
    EstimatedBand overall,
    List<CriterionScore> criteria,
    String summary,
    @Nullable String transcript) {

  public Assessment {
    criteria = List.copyOf(criteria);
  }

  public static Assessment of(Skill skill, ScoringResult result, @Nullable String transcript) {
    Set<Criterion> expected = Set.copyOf(Criterion.scoredFor(skill));
    Set<Criterion> got =
        result.criteria().stream().map(CriterionScore::criterion).collect(Collectors.toSet());
    if (!got.equals(expected) || result.criteria().size() != expected.size()) {
      throw new ScoringUnavailableException(
          "the model scored " + got + " but " + skill + " needs exactly " + expected);
    }
    EstimatedBand overall =
        EstimatedBand.overallOf(result.criteria().stream().map(CriterionScore::band).toList());
    return new Assessment(skill, overall, result.criteria(), result.summary(), transcript);
  }

  public boolean pronunciationScored() {
    return false;
  }
}
