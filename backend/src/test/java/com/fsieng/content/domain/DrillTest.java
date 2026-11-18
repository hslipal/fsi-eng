package com.fsieng.content.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class DrillTest {

  @Test
  void patternDrillNeedsItemsAndEachItemNeedsAnAnswer() {
    assertThatThrownBy(
            () -> new Drill.PatternDrill(DrillType.SUBSTITUTION, "Replace it.", null, List.of()))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("substitution");
    assertThatThrownBy(() -> new Drill.Item("contract", List.of()))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("contract");
    assertThatThrownBy(() -> new Drill.Item("contract", List.of(" ")))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Drill.PatternDrill(DrillType.RESPONSE, "", null, List.of()))
        .isInstanceOf(InvalidContentException.class);
  }

  @Test
  void dialogueNeedsLinesWithSpeakerAndText() {
    assertThatThrownBy(() -> new Drill.Dialogue(List.of()))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Drill.Line("", "Hello."))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Drill.Line("A", " ")).isInstanceOf(InvalidContentException.class);
  }

  @Test
  void drillsAreImmutableCopies() {
    List<String> answers = new ArrayList<>(List.of("Could you send me the contract?"));
    Drill.Item item = new Drill.Item("contract", answers);
    answers.clear();

    assertThat(item.answers()).hasSize(1);
  }

  @Test
  void parsesDrillTypeCodes() {
    for (DrillType type : DrillType.values()) {
      assertThat(DrillType.fromCode(type.code())).isEqualTo(type);
    }
    assertThatThrownBy(() -> DrillType.fromCode("dictation"))
        .isInstanceOf(InvalidContentException.class);
  }
}
