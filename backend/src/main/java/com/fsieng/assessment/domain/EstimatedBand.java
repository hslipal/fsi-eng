package com.fsieng.assessment.domain;

import java.util.List;

/**
 * An AI-estimated IELTS band: 0 to 9 in steps of 0.5. Never an official score; the web layer always
 * labels it as an estimate.
 */
public record EstimatedBand(double value) {

  private static final double EPSILON = 1e-9;

  public EstimatedBand {
    boolean halfStep = Math.abs(value * 2 - Math.rint(value * 2)) < EPSILON;
    if (value < 0 || value > 9 || !halfStep) {
      throw new InvalidAssessmentException("band must be 0-9 in steps of 0.5, was " + value);
    }
  }

  /** IELTS rounding: the mean goes to the nearest half band, .25 and .75 round up. */
  public static EstimatedBand overallOf(List<EstimatedBand> bands) {
    if (bands.isEmpty()) {
      throw new InvalidAssessmentException("an overall band needs at least one criterion");
    }
    double mean = bands.stream().mapToDouble(EstimatedBand::value).average().orElseThrow();
    return new EstimatedBand(Math.floor(mean * 2 + 0.5 + EPSILON) / 2);
  }
}
