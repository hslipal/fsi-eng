package com.fsieng.assessment.domain;

import java.util.Arrays;

/** A recorded answer. DeepSeek speech-to-text accepts at most 8 MiB and 120 seconds. */
public final class AudioClip {

  public static final int MAX_BYTES = 8 * 1024 * 1024;

  private final byte[] bytes;
  private final String filename;

  public AudioClip(byte[] bytes, String filename) {
    if (bytes.length == 0) {
      throw new InvalidAssessmentException("the recording is empty");
    }
    if (bytes.length > MAX_BYTES) {
      throw new InvalidAssessmentException("the recording must be at most 8 MiB");
    }
    if (filename.isBlank()) {
      throw new InvalidAssessmentException("the recording needs a file name");
    }
    this.bytes = Arrays.copyOf(bytes, bytes.length);
    this.filename = filename;
  }

  public byte[] bytes() {
    return Arrays.copyOf(bytes, bytes.length);
  }

  public String filename() {
    return filename;
  }

  public int size() {
    return bytes.length;
  }
}
