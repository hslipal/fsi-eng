package com.fsieng.content.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class TrackTest {

  @Test
  void parsesKnownCodes() {
    assertThat(Track.fromCode("business")).isEqualTo(Track.BUSINESS);
    assertThat(Track.fromCode("it")).isEqualTo(Track.IT);
    assertThat(Track.fromCode("ielts")).isEqualTo(Track.IELTS);
  }

  @Test
  void rejectsUnknownCodes() {
    assertThatThrownBy(() -> Track.fromCode("toefl"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("toefl");
  }
}
