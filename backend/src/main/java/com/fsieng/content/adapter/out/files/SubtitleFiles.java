package com.fsieng.content.adapter.out.files;

import com.fsieng.content.application.port.out.SubtitlesPort;
import com.fsieng.content.domain.InvalidContentException;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Subtitles;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.jspecify.annotations.Nullable;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Reads {@code <recording>.subtitles.json} next to a sample recording, from content/ or
 * content-dev/ like {@link SampleAudioFiles}, without ever leaving those folders. Written by
 * tools/subtitle_speaking.py.
 */
public class SubtitleFiles implements SubtitlesPort {

  /** File format: {@code {"segments": [{"start", "end", "text", "zh"}]}}. */
  record FileJson(@Nullable List<SegmentJson> segments) {}

  record SegmentJson(
      @Nullable Double start, @Nullable Double end, @Nullable String text, @Nullable String zh) {}

  private final Path contentDir;
  private final Path devDir;
  private final JsonMapper mapper;

  public SubtitleFiles(Path contentDir, Path devDir, JsonMapper mapper) {
    this.contentDir = contentDir.toAbsolutePath().normalize();
    this.devDir = devDir.toAbsolutePath().normalize();
    this.mapper = mapper;
  }

  /** {@code a/b.mp3} → {@code a/b.subtitles.json}. */
  static String subtitlesPath(String audioPath) {
    int slash = audioPath.lastIndexOf('/');
    int dot = audioPath.lastIndexOf('.');
    String stem = dot > slash ? audioPath.substring(0, dot) : audioPath;
    return stem + ".subtitles.json";
  }

  @Override
  public Optional<Subtitles> read(License license, String audioPath) {
    Path root = license instanceof License.DevOnly ? devDir : contentDir;
    Path file = root.resolve(subtitlesPath(audioPath)).normalize();
    if (!file.startsWith(root) || !Files.isRegularFile(file)) {
      return Optional.empty();
    }
    try {
      return Optional.of(toSubtitles(mapper.readValue(Files.readString(file), FileJson.class)));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    } catch (JacksonException e) {
      throw new InvalidContentException(
          "unreadable subtitles " + file.getFileName() + ": " + e.getOriginalMessage());
    }
  }

  private static Subtitles toSubtitles(FileJson json) {
    return new Subtitles(
        Objects.requireNonNullElse(json.segments(), List.<SegmentJson>of()).stream()
            .map(SubtitleFiles::toSegment)
            .toList());
  }

  private static Subtitles.Segment toSegment(SegmentJson json) {
    Double start = json.start();
    Double end = json.end();
    String text = json.text();
    if (start == null || end == null || text == null) {
      throw new InvalidContentException("a subtitle line needs start, end and text");
    }
    return new Subtitles.Segment(start, end, text.strip(), json.zh());
  }
}
