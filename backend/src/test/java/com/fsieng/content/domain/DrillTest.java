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

  @Test
  void readingQuestionsNeedOptionsThatContainTheAnswer() {
    List<String> tfng = List.of("TRUE", "FALSE", "NOT GIVEN");
    Drill.Item question = new Drill.Item("Gardens cool roofs.", List.of("TRUE"), tfng);

    assertThat(new Drill.Reading("Choose.", "Passage.", List.of(question)).items()).hasSize(1);
    assertThatThrownBy(() -> new Drill.Item("q", List.of("MAYBE"), tfng))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("not an option");
    List<Drill.Item> typed = List.of(new Drill.Item("q", List.of("TRUE")));
    assertThatThrownBy(() -> new Drill.Reading("Choose.", "Passage.", typed))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("needs options");
    assertThatThrownBy(() -> new Drill.Reading("Choose.", " ", List.of(question)))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Drill.Reading("Choose.", "Passage.", List.of()))
        .isInstanceOf(InvalidContentException.class);
  }

  @Test
  void speakingPromptsNeedAPartAndASafeAudioPath() {
    Drill.SpeakingPrompt prompt =
        new Drill.SpeakingPrompt("Do you like your job?", 1, "ielts/audio/q1.mp3", 16.2);

    assertThat(new Drill.Speaking("Answer aloud.", List.of(prompt)).prompts()).hasSize(1);
    assertThat(new Drill.SpeakingPrompt("Describe a place", 2, null, null).audio()).isNull();
    for (String unsafe :
        List.of("../secret.mp3", "/etc/passwd", "C:\\x.mp3", "a/../../b.mp3", " ")) {
      assertThatThrownBy(() -> new Drill.SpeakingPrompt("q", 1, unsafe, null))
          .isInstanceOf(InvalidContentException.class);
    }
    assertThatThrownBy(() -> new Drill.SpeakingPrompt("q", 4, null, null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Drill.SpeakingPrompt("q", 0, null, null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> new Drill.Speaking("Answer aloud.", List.of()))
        .isInstanceOf(InvalidContentException.class);
  }

  @Test
  void aChainedDrillStartsFromItsModelAndBuildsOnEachAnswer() {
    Drill.PatternDrill chain =
        new Drill.PatternDrill(
            DrillType.EXPANSION,
            "Change the sentence with the cue.",
            "There's a cup on the table.",
            List.of(
                new Drill.Item("spoon", List.of("There's a spoon on the table.")),
                new Drill.Item("on the chair", List.of("There's a spoon on the chair."))),
            true);

    assertThat(chain.baseOf(0)).isEqualTo("There's a cup on the table.");
    assertThat(chain.baseOf(1)).isEqualTo("There's a spoon on the table.");
    assertThat(
            new Drill.PatternDrill(
                    DrillType.EXPANSION,
                    "Add it.",
                    "Base.",
                    List.of(new Drill.Item("x", List.of("X."))))
                .baseOf(0))
        .isNull();
  }

  @Test
  void aChainedDrillNeedsAModelSentence() {
    List<Drill.Item> items = List.of(new Drill.Item("spoon", List.of("A spoon.")));
    assertThatThrownBy(
            () -> new Drill.PatternDrill(DrillType.EXPANSION, "Add it.", null, items, true))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("model");
    assertThatThrownBy(
            () -> new Drill.PatternDrill(DrillType.EXPANSION, "Add it.", " ", items, true))
        .isInstanceOf(InvalidContentException.class);
  }

  @Test
  void carriesOptionalTranslationsAndDropsBlankOnes() {
    Drill.PatternDrill chain =
        new Drill.PatternDrill(
            DrillType.EXPANSION,
            "Change the sentence with the cue.",
            "There's a cup on the table.",
            List.of(
                new Drill.Item(
                    "spoon", List.of("There's a spoon on the table."), List.of(), " 桌上有个勺子。 ", " "),
                new Drill.Item("on the chair", List.of("There's a spoon on the chair."))),
            true,
            "桌上有个杯子。");

    assertThat(chain.items().getFirst().translation()).isEqualTo("桌上有个勺子。");
    assertThat(chain.items().getFirst().cueTranslation()).isNull();
    assertThat(chain.baseTranslationOf(0)).isEqualTo("桌上有个杯子。");
    assertThat(chain.baseTranslationOf(1)).isEqualTo("桌上有个勺子。");
    assertThat(
            new Drill.PatternDrill(
                    DrillType.SUBSTITUTION,
                    "Replace it.",
                    "I want water.",
                    List.of(new Drill.Item("milk", List.of("I want milk."))),
                    false,
                    "")
                .baseTranslationOf(0))
        .isNull();
  }
}
