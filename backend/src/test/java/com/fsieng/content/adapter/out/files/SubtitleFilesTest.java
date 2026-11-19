package com.fsieng.content.adapter.out.files;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fsieng.content.domain.InvalidContentException;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Subtitles;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.json.JsonMapper;

class SubtitleFilesTest {

  @TempDir Path base;

  private SubtitleFiles files() {
    return new SubtitleFiles(
        base.resolve("content"), base.resolve("content-dev"), JsonMapper.builder().build());
  }

  private void write(String path, String json) throws IOException {
    Path file = base.resolve(path);
    Files.createDirectories(file.getParent());
    Files.writeString(file, json);
  }

  @Test
  void namesTheFileAfterTheRecording() {
    assertThat(SubtitleFiles.subtitlesPath("ielts/a b__1.mp3"))
        .isEqualTo("ielts/a b__1.subtitles.json");
    assertThat(SubtitleFiles.subtitlesPath("v1.0/clip")).isEqualTo("v1.0/clip.subtitles.json");
  }

  @Test
  void readsFromTheFolderThatMatchesTheLicense() throws IOException {
    write(
        "content-dev/ielts/q.subtitles.json",
        """
        {"segments": [{"start": 0, "end": 1.2, "text": " I like it. ", "zh": "我喜欢。"},
                      {"start": 1.2, "end": 2, "text": "Really."}]}\
        """);

    Subtitles subtitles = files().read(new License.DevOnly(), "ielts/q.mp3").orElseThrow();

    assertThat(subtitles.segments())
        .containsExactly(
            new Subtitles.Segment(0, 1.2, "I like it.", "我喜欢。"),
            new Subtitles.Segment(1.2, 2, "Really.", null));
    assertThat(files().read(new License.Generated("claude"), "ielts/q.mp3")).isEmpty();
  }

  @Test
  void neverLeavesItsFolderAndIgnoresMissingFiles() throws IOException {
    write("secret.subtitles.json", "{\"segments\": [{\"start\": 0, \"end\": 1, \"text\": \"x\"}]}");

    assertThat(files().read(new License.DevOnly(), "../secret.mp3")).isEmpty();
    assertThat(files().read(new License.DevOnly(), "ielts/none.mp3")).isEmpty();
  }

  @Test
  void rejectsBrokenFiles() throws IOException {
    write("content/ielts/bad.subtitles.json", "{ not json");
    write("content/ielts/partial.subtitles.json", "{\"segments\": [{\"start\": 0}]}");
    write("content/ielts/empty.subtitles.json", "{}");
    License published = new License.Generated("claude");

    assertThatThrownBy(() -> files().read(published, "ielts/bad.mp3"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("bad.subtitles.json");
    assertThatThrownBy(() -> files().read(published, "ielts/partial.mp3"))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("start, end and text");
    assertThatThrownBy(() -> files().read(published, "ielts/empty.mp3"))
        .isInstanceOf(InvalidContentException.class);
  }
}
