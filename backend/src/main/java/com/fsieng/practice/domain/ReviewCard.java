package com.fsieng.practice.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Leitner box of one drill item for one learner. Box 0 means never answered correctly; boxes 1-5
 * wait 1, 3, 7, 14 and 30 days before the next review.
 */
public record ReviewCard(LearnerId learner, CardKey key, int box, Instant dueAt) {

  public static final int TOP_BOX = 5;
  private static final List<Duration> WAIT =
      List.of(
          Duration.ofDays(1),
          Duration.ofDays(3),
          Duration.ofDays(7),
          Duration.ofDays(14),
          Duration.ofDays(30));
  private static final Duration RETRY_SOON = Duration.ofMinutes(10);

  public ReviewCard {
    if (box < 0 || box > TOP_BOX) {
      throw new InvalidPracticeException("box must be between 0 and " + TOP_BOX);
    }
  }

  public static ReviewCard fresh(LearnerId learner, CardKey key, Instant now) {
    return new ReviewCard(learner, key, 0, now);
  }

  /** The card after an answer: correct moves up a box, close stays, wrong drops to box 0. */
  public ReviewCard after(Verdict verdict, Instant now) {
    return switch (verdict) {
      case CORRECT -> {
        int next = Math.min(box + 1, TOP_BOX);
        yield new ReviewCard(learner, key, next, now.plus(WAIT.get(next - 1)));
      }
      case CLOSE -> new ReviewCard(learner, key, box, now.plus(Duration.ofDays(1)));
      case WRONG -> new ReviewCard(learner, key, 0, now.plus(RETRY_SOON));
    };
  }

  public boolean isDue(Instant now) {
    return !dueAt.isAfter(now);
  }
}
