package com.fsieng.assessment.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class EstimatedBandTest {

  private static List<EstimatedBand> bands(double... values) {
    return java.util.Arrays.stream(values).mapToObj(EstimatedBand::new).toList();
  }

  @Test
  void acceptsHalfBandsFromZeroToNine() {
    assertThat(new EstimatedBand(0).value()).isZero();
    assertThat(new EstimatedBand(6.5).value()).isEqualTo(6.5);
    assertThat(new EstimatedBand(9).value()).isEqualTo(9);
  }

  @Test
  void rejectsAnythingElse() {
    for (double bad : new double[] {-0.5, 9.5, 6.25, 7.7}) {
      assertThatThrownBy(() -> new EstimatedBand(bad))
          .isInstanceOf(InvalidAssessmentException.class);
    }
  }

  @Test
  void overallUsesIeltsRounding() {
    assertThat(EstimatedBand.overallOf(bands(6, 6, 6, 6.5)).value()).isEqualTo(6.0);
    assertThat(EstimatedBand.overallOf(bands(6, 6, 6.5, 6.5)).value()).isEqualTo(6.5);
    assertThat(EstimatedBand.overallOf(bands(6.5, 6.5, 7, 7)).value()).isEqualTo(7.0);
    assertThat(EstimatedBand.overallOf(bands(6, 6.5, 6)).value()).isEqualTo(6.0);
  }

  @Test
  void overallNeedsAtLeastOneBand() {
    assertThatThrownBy(() -> EstimatedBand.overallOf(List.of()))
        .isInstanceOf(InvalidAssessmentException.class);
  }
}
