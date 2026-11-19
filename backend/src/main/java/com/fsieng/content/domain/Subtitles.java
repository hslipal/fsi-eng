package com.fsieng.content.domain;

import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * Timed subtitles of a sample recording: what is said (English) and, when available, a Chinese
 * translation of each line.
 */
public record Subtitles(List<Segment> segments) {

  public Subtitles {
    if (segments.isEmpty()) {
      throw new InvalidContentException("subtitles need at least one line");
    }
    segments = List.copyOf(segments);
  }

  /** One line, shown from {@code start} to {@code end} seconds. */
  public record Segment(double start, double end, String text, @Nullable String translation) {

    public Segment {
      if (start < 0 || end < start) {
        throw new InvalidContentException("a subtitle line needs 0 <= start <= end");
      }
      if (text.isBlank()) {
        throw new InvalidContentException("a subtitle line needs text");
      }
      if (translation != null && translation.isBlank()) {
        translation = null;
      }
    }
  }
}
