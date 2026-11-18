package com.fsieng.practice.domain;

import java.util.List;
import java.util.Locale;

/**
 * Grades a typed answer against the accepted answers. Case, repeated spaces, curly quotes and final
 * punctuation do not count; a small edit distance counts as {@link Verdict#CLOSE}.
 */
public final class AnswerGrader {

  private static final int CHARS_PER_ALLOWED_SLIP = 15;

  public Grade grade(String answer, List<String> accepted) {
    if (accepted.isEmpty()) {
      throw new InvalidPracticeException("nothing to grade against");
    }
    String given = normalize(answer);
    String best = accepted.getFirst();
    int bestDistance = Integer.MAX_VALUE;
    for (String candidate : accepted) {
      int distance = distance(given, normalize(candidate));
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    return new Grade(verdict(bestDistance, normalize(best).length()), best);
  }

  private static Verdict verdict(int distance, int length) {
    if (distance == 0) {
      return Verdict.CORRECT;
    }
    int allowed = Math.max(1, length / CHARS_PER_ALLOWED_SLIP);
    return distance <= allowed ? Verdict.CLOSE : Verdict.WRONG;
  }

  static String normalize(String text) {
    return text.replace('’', '\'')
        .replace('‘', '\'')
        .replace('“', '"')
        .replace('”', '"')
        .toLowerCase(Locale.ROOT)
        .replaceAll("\\s+", " ")
        .strip()
        .replaceAll("[.!?]+$", "")
        .strip();
  }

  /** Levenshtein distance. */
  static int distance(String a, String b) {
    int[] previous = new int[b.length() + 1];
    int[] current = new int[b.length() + 1];
    for (int j = 0; j <= b.length(); j++) {
      previous[j] = j;
    }
    for (int i = 1; i <= a.length(); i++) {
      current[0] = i;
      for (int j = 1; j <= b.length(); j++) {
        int substitution = previous[j - 1] + (a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1);
        current[j] = Math.min(substitution, Math.min(previous[j], current[j - 1]) + 1);
      }
      int[] swap = previous;
      previous = current;
      current = swap;
    }
    return previous[b.length()];
  }
}
