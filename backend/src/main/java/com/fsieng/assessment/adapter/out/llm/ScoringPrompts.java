package com.fsieng.assessment.adapter.out.llm;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

/** The protected scoring prompts from prompts/scoring/, packaged on the classpath. */
record ScoringPrompts(String writing, String speaking) {

  static ScoringPrompts load() {
    return new ScoringPrompts(
        read("prompts/scoring/writing.md"), read("prompts/scoring/speaking.md"));
  }

  private static String read(String resource) {
    try (InputStream in = ScoringPrompts.class.getClassLoader().getResourceAsStream(resource)) {
      if (in == null) {
        throw new IllegalStateException("missing scoring prompt on the classpath: " + resource);
      }
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }
}
