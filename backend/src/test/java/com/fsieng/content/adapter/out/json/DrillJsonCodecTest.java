package com.fsieng.content.adapter.out.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.DrillType;
import com.fsieng.content.domain.InvalidContentException;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class DrillJsonCodecTest {

  private final DrillJsonCodec codec = new DrillJsonCodec(JsonMapper.builder().build());

  @Test
  void roundTripsEveryDrillKind() {
    List<Drill> drills =
        List.of(
            new Drill.Dialogue(
                List.of(
                    new Drill.Line("A", "Yesterday I fixed the login bug."),
                    new Drill.Line("B", "Any blockers?"))),
            new Drill.PatternDrill(
                DrillType.TRANSFORMATION,
                "Make it more polite.",
                null,
                List.of(
                    new Drill.Item(
                        "Your price is too high.",
                        List.of("We were hoping for something closer to our budget.")))),
            new Drill.Reading(
                "TRUE, FALSE or NOT GIVEN?",
                "Rooftop gardens cool buildings.",
                List.of(
                    new Drill.Item(
                        "Gardens warm buildings.",
                        List.of("FALSE"),
                        List.of("TRUE", "FALSE", "NOT GIVEN")))),
            new Drill.Speaking(
                "Answer aloud.",
                List.of(
                    new Drill.SpeakingPrompt("Do you like your job?", 1, "ielts/a/q1.mp3", 16.2),
                    new Drill.SpeakingPrompt("Describe a natural place", 2, null, null))));

    assertThat(codec.decode(codec.encode(drills))).isEqualTo(drills);
  }

  @Test
  void missingJsonMeansNoDrills() {
    assertThat(DrillJsonCodec.fromJson(null)).isEmpty();
  }

  @Test
  void rejectsDrillsWithoutRequiredParts() {
    assertThatThrownBy(() -> codec.decode("[{\"type\":\"reading\",\"items\":[]}]"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("reading instruction");
    assertThatThrownBy(
            () -> codec.decode("[{\"type\":\"reading\",\"instruction\":\"x\",\"items\":[]}]"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("reading passage");
    assertThatThrownBy(() -> codec.decode("[{\"instruction\":\"x\"}]"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("drill type");
    assertThatThrownBy(() -> codec.decode("[{\"type\":\"dialogue\"}]"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("dialogue lines");
    assertThatThrownBy(() -> codec.decode("[{\"type\":\"substitution\",\"items\":[]}]"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("instruction");
    assertThatThrownBy(() -> codec.decode("[{\"type\":\"response\",\"instruction\":\"Answer.\"}]"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("items");
  }
}
