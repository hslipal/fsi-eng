package com.fsieng.practice.domain;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Grades a typed or spoken answer against the accepted answers. Case, repeated spaces, curly
 * quotes, commas and final punctuation do not count, nor does writing out a contraction ("don't" =
 * "do not"); a small edit distance counts as {@link Verdict#CLOSE}.
 */
public final class AnswerGrader {

  private static final int CHARS_PER_ALLOWED_SLIP = 15;

  /**
   * Unambiguous contractions, written out, so "I'm" and "I am" grade the same (speech recognition
   * picks either). "'s" and "'d" are left alone: they can mean is/has and would/had.
   */
  private static final Map<String, String> CONTRACTIONS = contractions();

  private static Map<String, String> contractions() {
    Map<String, String> map = new LinkedHashMap<>();
    map.put("\\bcan't\\b", "cannot");
    map.put("\\bwon't\\b", "will not");
    map.put("\\bshan't\\b", "shall not");
    map.put("\\bcan not\\b", "cannot");
    map.put("n't\\b", " not");
    map.put("\\bi'm\\b", "i am");
    map.put("'re\\b", " are");
    map.put("'ve\\b", " have");
    map.put("'ll\\b", " will");
    return Collections.unmodifiableMap(map);
  }

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

  /** Closed questions: the chosen option is right or wrong, never "close". */
  public Grade gradeChoice(String choice, List<String> accepted) {
    if (accepted.isEmpty()) {
      throw new InvalidPracticeException("nothing to grade against");
    }
    String given = normalize(choice);
    for (String candidate : accepted) {
      if (normalize(candidate).equals(given)) {
        return new Grade(Verdict.CORRECT, candidate);
      }
    }
    return new Grade(Verdict.WRONG, accepted.getFirst());
  }

  private static Verdict verdict(int distance, int length) {
    if (distance == 0) {
      return Verdict.CORRECT;
    }
    int allowed = Math.max(1, length / CHARS_PER_ALLOWED_SLIP);
    return distance <= allowed ? Verdict.CLOSE : Verdict.WRONG;
  }

  static String normalize(String text) {
    String plain =
        text.replace('’', '\'')
            .replace('‘', '\'')
            .replace('“', '"')
            .replace('”', '"')
            .toLowerCase(Locale.ROOT);
    for (Map.Entry<String, String> contraction : CONTRACTIONS.entrySet()) {
      plain = plain.replaceAll(contraction.getKey(), contraction.getValue());
    }
    return plain
        .replaceAll("[,;:\"]", " ")
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
