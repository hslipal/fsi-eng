package com.fsieng.content.adapter.in.web;

import com.fsieng.content.domain.Subtitles;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Mirrors frontend SubtitlesSchema; see docs/api-contract.md. */
public record SubtitlesResponse(List<Line> lines) {

  /** {@code translation}: Chinese, or null when the line has not been translated. */
  public record Line(double start, double end, String text, @Nullable String translation) {}

  static SubtitlesResponse from(Subtitles subtitles) {
    return new SubtitlesResponse(
        subtitles.segments().stream()
            .map(s -> new Line(s.start(), s.end(), s.text(), s.translation()))
            .toList());
  }
}
