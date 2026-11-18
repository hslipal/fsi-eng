package com.fsieng.assessment.adapter.in.web;

import com.fsieng.assessment.domain.Assessment;
import com.fsieng.assessment.domain.CriterionScore;
import java.util.List;
import java.util.Locale;
import org.jspecify.annotations.Nullable;

/**
 * An AI-estimated score. {@code estimated} is always true and the disclaimer always present, so no
 * client can show it as an official result. Mirrors frontend AssessmentSchema.
 */
public record AssessmentResponse(
    boolean estimated,
    String disclaimer,
    String skill,
    double overallBand,
    List<CriterionResponse> criteria,
    String summary,
    boolean pronunciationScored,
    @Nullable String transcript) {

  static final String DISCLAIMER = "AI 估计分数，仅供练习参考，不等同于雅思官方考官评分。";

  /** One criterion score. */
  public record CriterionResponse(String criterion, double band, String comment) {

    static CriterionResponse from(CriterionScore score) {
      return new CriterionResponse(score.criterion().code(), score.band().value(), score.comment());
    }
  }

  static AssessmentResponse from(Assessment assessment) {
    return new AssessmentResponse(
        true,
        DISCLAIMER,
        assessment.skill().name().toLowerCase(Locale.ROOT),
        assessment.overall().value(),
        assessment.criteria().stream().map(CriterionResponse::from).toList(),
        assessment.summary(),
        assessment.pronunciationScored(),
        assessment.transcript());
  }
}
