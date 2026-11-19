package com.fsieng.practice.domain;

/** How an answer compares with the accepted answers. */
public enum Verdict {
  /** Matches an accepted answer (ignoring case, spacing and final punctuation). */
  CORRECT("correct"),
  /** One or two typing slips away from an accepted answer. */
  CLOSE("close"),
  WRONG("wrong");

  private final String code;

  Verdict(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }

  /** The verdict with this code ("correct", "close", "wrong"). */
  public static Verdict fromCode(String code) {
    for (Verdict verdict : values()) {
      if (verdict.code.equals(code)) {
        return verdict;
      }
    }
    throw new InvalidPracticeException("unknown verdict: " + code);
  }
}
