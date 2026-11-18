package com.fsieng.content.application.port.out;

import com.fsieng.content.domain.License;
import com.fsieng.content.domain.SampleAudio;
import java.util.Optional;

public interface SampleAudioPort {

  /**
   * Reads a sample recording. Dev-only material lives in the dev folder, everything else in the
   * content folder; the path never leaves that folder.
   */
  Optional<SampleAudio> read(License license, String relativePath);
}
