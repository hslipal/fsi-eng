package com.fsieng.content.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class SubtitlesTest {

  @Test
  void keepsLinesAndDropsBlankTranslations() {
    Subtitles subtitles =
        new Subtitles(
            List.of(
                new Subtitles.Segment(0, 1.5, "Hello.", "你好。"),
                new Subtitles.Segment(1.5, 3, "Bye.", " ")));

    assertThat(subtitles.segments()).hasSize(2);
    assertThat(subtitles.segments().get(1).translation()).isNull();
  }

  @Test
  void rejectsEmptyOrBrokenLines() {
    assertThatThrownBy(() -> new Subtitles(List.of())).isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Subtitles.Segment(-1, 1, "Hi.", null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Subtitles.Segment(2, 1, "Hi.", null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Subtitles.Segment(0, 1, " ", null))
        .isInstanceOf(InvalidContentException.class);
  }
}
