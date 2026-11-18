package com.fsieng.content.domain;

import java.util.Arrays;

/** The bytes of a recorded sample answer. */
public final class SampleAudio {

  private final byte[] bytes;
  private final String contentType;

  public SampleAudio(byte[] bytes, String contentType) {
    this.bytes = Arrays.copyOf(bytes, bytes.length);
    this.contentType = contentType;
  }

  public byte[] bytes() {
    return Arrays.copyOf(bytes, bytes.length);
  }

  public String contentType() {
    return contentType;
  }
}
