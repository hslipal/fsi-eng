package com.fsieng.content.adapter.out.files;

import com.fsieng.content.application.port.out.SampleAudioPort;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.SampleAudio;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Optional;

/** Reads sample recordings from content/ or content-dev/ without ever leaving those folders. */
public class SampleAudioFiles implements SampleAudioPort {

  private final Path contentDir;
  private final Path devDir;

  public SampleAudioFiles(Path contentDir, Path devDir) {
    this.contentDir = contentDir.toAbsolutePath().normalize();
    this.devDir = devDir.toAbsolutePath().normalize();
  }

  @Override
  public Optional<SampleAudio> read(License license, String relativePath) {
    Path root = license instanceof License.DevOnly ? devDir : contentDir;
    Path file = root.resolve(relativePath).normalize();
    if (!file.startsWith(root) || !Files.isRegularFile(file)) {
      return Optional.empty();
    }
    try {
      return Optional.of(new SampleAudio(Files.readAllBytes(file), contentType(file)));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  static String contentType(Path file) {
    String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
    if (name.endsWith(".mp3")) {
      return "audio/mpeg";
    }
    if (name.endsWith(".wav")) {
      return "audio/wav";
    }
    if (name.endsWith(".m4a")) {
      return "audio/mp4";
    }
    return "application/octet-stream";
  }
}
