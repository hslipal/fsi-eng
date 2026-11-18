package com.fsieng.content.domain;

/** The three learning tracks. */
public enum Track {
  BUSINESS("business"),
  IT("it"),
  IELTS("ielts");

  private final String code;

  Track(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }

  public static Track fromCode(String code) {
    for (Track track : values()) {
      if (track.code.equals(code)) {
        return track;
      }
    }
    throw new InvalidContentException("unknown track: " + code);
  }
}
