package com.fsieng.content.adapter.out.files;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.domain.License;
import com.fsieng.content.domain.SampleAudio;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class SampleAudioFilesTest {

  @TempDir Path base;

  @Test
  void readsFromTheFolderThatMatchesTheLicense() throws IOException {
    Path content = Files.createDirectories(base.resolve("content/ielts"));
    Path dev = Files.createDirectories(base.resolve("content-dev/ielts"));
    Files.writeString(content.resolve("a.mp3"), "licensed", StandardCharsets.UTF_8);
    Files.writeString(dev.resolve("a.mp3"), "dev", StandardCharsets.UTF_8);
    SampleAudioFiles files =
        new SampleAudioFiles(base.resolve("content"), base.resolve("content-dev"));

    SampleAudio devSample = files.read(new License.DevOnly(), "ielts/a.mp3").orElseThrow();
    SampleAudio licensed = files.read(new License.Generated("claude"), "ielts/a.mp3").orElseThrow();

    assertThat(new String(devSample.bytes(), StandardCharsets.UTF_8)).isEqualTo("dev");
    assertThat(new String(licensed.bytes(), StandardCharsets.UTF_8)).isEqualTo("licensed");
    assertThat(licensed.contentType()).isEqualTo("audio/mpeg");
  }

  @Test
  void neverLeavesItsFolderAndIgnoresMissingFiles() throws IOException {
    Files.createDirectories(base.resolve("content"));
    Files.writeString(base.resolve("secret.txt"), "secret", StandardCharsets.UTF_8);
    SampleAudioFiles files =
        new SampleAudioFiles(base.resolve("content"), base.resolve("content-dev"));

    assertThat(files.read(new License.Generated("claude"), "../secret.txt")).isEmpty();
    assertThat(files.read(new License.Generated("claude"), "ielts/missing.mp3")).isEmpty();
  }

  @Test
  void namesCommonAudioTypes() {
    assertThat(SampleAudioFiles.contentType(Path.of("a.MP3"))).isEqualTo("audio/mpeg");
    assertThat(SampleAudioFiles.contentType(Path.of("a.wav"))).isEqualTo("audio/wav");
    assertThat(SampleAudioFiles.contentType(Path.of("a.m4a"))).isEqualTo("audio/mp4");
    assertThat(SampleAudioFiles.contentType(Path.of("a.ogg")))
        .isEqualTo("application/octet-stream");
  }
}
