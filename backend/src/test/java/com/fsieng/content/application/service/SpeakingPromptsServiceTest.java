package com.fsieng.content.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.application.port.out.SampleAudioPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.ContentNotFoundException;
import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.SampleAudio;
import com.fsieng.content.domain.SpeakingPromptRef;
import com.fsieng.content.domain.Subtitles;
import com.fsieng.content.domain.Track;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.Test;

class SpeakingPromptsServiceTest {

  private static final UUID PUBLISHED = new UUID(1L, 1L);
  private static final UUID DEV = new UUID(2L, 2L);

  private static ContentItem item(UUID id, License license, @Nullable String reviewer) {
    return new ContentItem(
        new ContentItemId(id),
        Track.IELTS,
        "Speaking",
        null,
        license,
        "band 6.5",
        reviewer,
        List.of(
            new Drill.Speaking(
                "Answer aloud.",
                List.of(
                    new Drill.SpeakingPrompt(
                        "Q" + id.getLeastSignificantBits(), 1, "ielts/a.mp3", 9.5),
                    new Drill.SpeakingPrompt("Describe a park", 2, null, null)))));
  }

  private static final List<ContentItem> ITEMS =
      List.of(
          item(PUBLISHED, new License.Generated("claude"), "admin"),
          item(DEV, new License.DevOnly(), null),
          item(new UUID(3L, 3L), new License.Generated("claude"), null));

  private static Optional<SampleAudio> fakeAudio(License license, String path) {
    byte[] bytes = (license.kind() + ":" + path).getBytes(StandardCharsets.UTF_8);
    return Optional.of(new SampleAudio(bytes, "audio/mpeg"));
  }

  private static Optional<SampleAudio> noAudio(License license, String path) {
    return Optional.empty();
  }

  private final LoadContentPort content = _ -> ITEMS;
  private final SampleAudioPort audio = SpeakingPromptsServiceTest::fakeAudio;

  @Test
  void listsOnlyPublishedQuestionsByDefault() {
    List<SpeakingPromptRef> refs = new SpeakingPromptsService(content, audio, false).list();

    assertThat(refs).hasSize(2);
    assertThat(refs.getFirst())
        .isEqualTo(new SpeakingPromptRef(PUBLISHED + ":0:0", 1, "Q1", true, 9.5, false));
    assertThat(refs.get(1).hasSample()).isFalse();
  }

  @Test
  void includesDevOnlyQuestionsWhenEnabled() {
    List<SpeakingPromptRef> refs = new SpeakingPromptsService(content, audio, true).list();

    assertThat(refs).hasSize(4);
    assertThat(refs.get(2).devOnly()).isTrue();
    assertThat(refs.get(2).key()).isEqualTo(DEV + ":0:0");
  }

  @Test
  void servesTheSampleFromTheRightFolder() {
    SpeakingPromptsService service = new SpeakingPromptsService(content, audio, true);

    assertThat(new String(service.sample(DEV + ":0:0").bytes(), StandardCharsets.UTF_8))
        .isEqualTo("dev-only:ielts/a.mp3");
    assertThat(service.sample(PUBLISHED + ":0:0").contentType()).isEqualTo("audio/mpeg");
  }

  @Test
  void hidesDevOnlySamplesWhenDisabledAndReportsMissingOnes() {
    SpeakingPromptsService service = new SpeakingPromptsService(content, audio, false);

    assertThatThrownBy(() -> service.sample(DEV + ":0:0"))
        .isInstanceOf(ContentNotFoundException.class);
    assertThatThrownBy(() -> service.sample(PUBLISHED + ":0:1"))
        .isInstanceOf(ContentNotFoundException.class)
        .hasMessageContaining("sample answer");
    SpeakingPromptsService noFiles =
        new SpeakingPromptsService(content, SpeakingPromptsServiceTest::noAudio, false);
    assertThatThrownBy(() -> noFiles.sample(PUBLISHED + ":0:0"))
        .isInstanceOf(ContentNotFoundException.class);
  }

  private static Optional<Subtitles> fakeSubtitles(License license, String path) {
    return license instanceof License.DevOnly
        ? Optional.of(new Subtitles(List.of(new Subtitles.Segment(0, 1, path, "字幕"))))
        : Optional.empty();
  }

  @Test
  void servesSubtitlesOfASampleOrSaysThereAreNone() {
    SpeakingPromptsService service =
        new SpeakingPromptsService(content, audio, SpeakingPromptsServiceTest::fakeSubtitles, true);

    assertThat(service.subtitles(DEV + ":0:0").segments().getFirst().text())
        .isEqualTo("ielts/a.mp3");
    assertThatThrownBy(() -> service.subtitles(PUBLISHED + ":0:0"))
        .isInstanceOf(ContentNotFoundException.class)
        .hasMessageContaining("subtitles");
    assertThatThrownBy(() -> service.subtitles(DEV + ":0:1"))
        .isInstanceOf(ContentNotFoundException.class);
    assertThatThrownBy(() -> service.subtitles("missing"))
        .isInstanceOf(ContentNotFoundException.class);
    assertThatThrownBy(
            () -> new SpeakingPromptsService(content, audio, true).subtitles(DEV + ":0:0"))
        .isInstanceOf(ContentNotFoundException.class);
  }
}
