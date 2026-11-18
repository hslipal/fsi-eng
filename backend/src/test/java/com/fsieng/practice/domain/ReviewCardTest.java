package com.fsieng.practice.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ReviewCardTest {

  private static final Instant NOW = Instant.parse("2026-11-19T00:00:00Z");
  private static final LearnerId LEARNER = new LearnerId("local");
  private static final CardKey KEY = CardKey.of(new UUID(1L, 2L), 0, 3);

  @Test
  void correctAnswersClimbTheBoxesWithGrowingWaits() {
    ReviewCard card = ReviewCard.fresh(LEARNER, KEY, NOW);
    List<Long> waits = List.of(1L, 3L, 7L, 14L, 30L, 30L);
    for (long days : waits) {
      card = card.after(Verdict.CORRECT, NOW);
      assertThat(card.dueAt()).isEqualTo(NOW.plus(Duration.ofDays(days)));
    }
    assertThat(card.box()).isEqualTo(ReviewCard.TOP_BOX);
  }

  @Test
  void closeKeepsTheBoxAndWrongStartsOverSoon() {
    ReviewCard card = new ReviewCard(LEARNER, KEY, 3, NOW);

    ReviewCard close = card.after(Verdict.CLOSE, NOW);
    ReviewCard wrong = card.after(Verdict.WRONG, NOW);

    assertThat(close.box()).isEqualTo(3);
    assertThat(close.dueAt()).isEqualTo(NOW.plus(Duration.ofDays(1)));
    assertThat(wrong.box()).isZero();
    assertThat(wrong.dueAt()).isEqualTo(NOW.plus(Duration.ofMinutes(10)));
  }

  @Test
  void isDueOnceItsTimeHasCome() {
    ReviewCard card = new ReviewCard(LEARNER, KEY, 1, NOW);

    assertThat(card.isDue(NOW)).isTrue();
    assertThat(card.isDue(NOW.minusSeconds(1))).isFalse();
  }

  @Test
  void rejectsInvalidValues() {
    assertThatThrownBy(() -> new ReviewCard(LEARNER, KEY, 6, NOW))
        .isInstanceOf(InvalidPracticeException.class);
    assertThatThrownBy(() -> new ReviewCard(LEARNER, KEY, -1, NOW))
        .isInstanceOf(InvalidPracticeException.class);
    assertThatThrownBy(() -> new CardKey(" ")).isInstanceOf(InvalidPracticeException.class);
    assertThatThrownBy(() -> new LearnerId("")).isInstanceOf(InvalidPracticeException.class);
    assertThatThrownBy(() -> new LearnerId("x".repeat(101)))
        .isInstanceOf(InvalidPracticeException.class);
    assertThatThrownBy(
            () -> new PracticeItem(KEY, "t", "substitution", "i", null, "cue", List.of()))
        .isInstanceOf(InvalidPracticeException.class);
  }

  @Test
  void cardKeyNamesTheContentDrillAndItem() {
    assertThat(KEY.value()).isEqualTo(new UUID(1L, 2L) + ":0:3");
  }
}
