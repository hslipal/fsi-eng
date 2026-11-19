package com.fsieng.content.application.port.out;

import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Subtitles;
import java.util.Optional;

public interface SubtitlesPort {

  /**
   * The subtitles of a sample recording, kept next to it as {@code <name>.subtitles.json}; empty
   * when there are none.
   */
  Optional<Subtitles> read(License license, String audioPath);
}
