package com.fsieng.content.domain;

/** FSI pattern-drill types with closed answers (auto-gradable). */
public enum DrillType {
  SUBSTITUTION("substitution"),
  TRANSFORMATION("transformation"),
  EXPANSION("expansion"),
  TRANSLATION("translation"),
  RESPONSE("response");

  private final String code;

  DrillType(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }

  public static DrillType fromCode(String code) {
    for (DrillType type : values()) {
      if (type.code.equals(code)) {
        return type;
      }
    }
    throw new InvalidContentException("unknown drill type: " + code);
  }
}
