package com.fsieng.practice.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class VerdictTest {

  @Test
  void readsItsCode() {
    for (Verdict verdict : Verdict.values()) {
      assertThat(Verdict.fromCode(verdict.code())).isEqualTo(verdict);
    }
  }

  @Test
  void rejectsAnUnknownCode() {
    assertThatThrownBy(() -> Verdict.fromCode("perfect"))
        .isInstanceOf(InvalidPracticeException.class)
        .hasMessageContaining("perfect");
  }
}
