package com.fsieng.practice.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fsieng.practice.application.port.out.DrillCatalogPort;
import com.fsieng.practice.application.port.out.ReviewCardStorePort;
import com.fsieng.practice.domain.AnswerGrader;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.Feedback;
import com.fsieng.practice.domain.LearnerId;
import com.fsieng.practice.domain.Lesson;
import com.fsieng.practice.domain.LessonNotFoundException;
import com.fsieng.practice.domain.PracticeItem;
import com.fsieng.practice.domain.ReviewCard;
import com.fsieng.practice.domain.UnknownCardException;
import com.fsieng.practice.domain.Verdict;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PracticeServiceTest {

  private static final Instant NOW = Instant.parse("2026-11-19T00:00:00Z");
  private static final LearnerId LEARNER = new LearnerId("local");

  private static PracticeItem item(int index) {
    return new PracticeItem(
        CardKey.of(new UUID(0L, 1L), 0, index),
        "Requesting a quote",
        "substitution",
        "Replace the document.",
        null,
        "cue " + index,
        List.of("Answer " + index + "."));
  }

  private static final PracticeItem CHOICE =
      new PracticeItem(
          CardKey.of(new UUID(0L, 2L), 0, 0),
          "Rooftop gardens",
          "reading",
          "TRUE, FALSE or NOT GIVEN?",
          null,
          "Passage text.",
          "The first garden opened in 2010.",
          List.of("TRUE", "FALSE", "NOT GIVEN"),
          List.of("FALSE"));

  private final List<PracticeItem> items = List.of(item(0), item(1), item(2), item(3), CHOICE);

  private final DrillCatalogPort catalog =
      new DrillCatalogPort() {
        @Override
        public List<PracticeItem> itemsFor(String track) {
          return items;
        }

        @Override
        public Optional<PracticeItem> find(CardKey key) {
          return items.stream().filter(item -> item.key().equals(key)).findFirst();
        }

        @Override
        public List<Lesson> lessonsFor(String track) {
          return List.of(lessonOne, READING_ONLY);
        }

        @Override
        public Optional<Lesson> lesson(String id) {
          return lessonsFor("business").stream().filter(l -> l.id().equals(id)).findFirst();
        }
      };

  private final Lesson lessonOne = new Lesson("lesson-1", "Requesting a quote", "ILR 1+", items);
  private static final Lesson READING_ONLY =
      new Lesson("lesson-2", "Rooftop gardens", "Band 6", List.of(CHOICE));

  private final Map<CardKey, ReviewCard> stored = new HashMap<>();

  private final ReviewCardStorePort store =
      new ReviewCardStorePort() {
        @Override
        public Optional<ReviewCard> find(LearnerId learner, CardKey key) {
          return Optional.ofNullable(stored.get(key));
        }

        @Override
        public List<ReviewCard> findAll(LearnerId learner) {
          return new ArrayList<>(stored.values());
        }

        @Override
        public void save(ReviewCard card) {
          stored.put(card.key(), card);
        }
      };

  private final PracticeService service =
      new PracticeService(catalog, store, new AnswerGrader(), Clock.fixed(NOW, ZoneOffset.UTC));

  private void remember(int index, Duration dueIn) {
    CardKey key = items.get(index).key();
    stored.put(key, new ReviewCard(LEARNER, key, 1, NOW.plus(dueIn)));
  }

  @Test
  void dueReviewsComeFirstOldestFirstThenUnseenItems() {
    remember(2, Duration.ofHours(-1));
    remember(3, Duration.ofDays(-2));
    remember(0, Duration.ofDays(2));

    List<PracticeItem> cards = service.dueCards(LEARNER, "business", 10);

    assertThat(cards).containsExactly(items.get(3), items.get(2), items.get(1), CHOICE);
  }

  @Test
  void respectsTheLimit() {
    assertThat(service.dueCards(LEARNER, "business", 2))
        .containsExactly(items.get(0), items.get(1));
  }

  @Test
  void aCorrectAnswerMovesTheCardToBoxOne() {
    Feedback feedback = service.submit(LEARNER, items.get(1).key(), "answer 1");

    assertThat(feedback.grade().verdict()).isEqualTo(Verdict.CORRECT);
    assertThat(feedback.card().box()).isEqualTo(1);
    assertThat(stored.get(items.get(1).key())).isEqualTo(feedback.card());
  }

  @Test
  void aWrongAnswerOnAKnownCardDropsItToBoxZero() {
    remember(0, Duration.ZERO);

    Feedback feedback = service.submit(LEARNER, items.get(0).key(), "something else entirely");

    assertThat(feedback.grade().verdict()).isEqualTo(Verdict.WRONG);
    assertThat(feedback.card().box()).isZero();
  }

  @Test
  void unknownCardsAreRejected() {
    CardKey unknown = new CardKey("nope");

    assertThatThrownBy(() -> service.submit(LEARNER, unknown, "x"))
        .isInstanceOf(UnknownCardException.class)
        .hasMessageContaining("nope");
  }

  @Test
  void readingQuestionsAreGradedStrictly() {
    assertThat(service.submit(LEARNER, CHOICE.key(), "false").grade().verdict())
        .isEqualTo(Verdict.CORRECT);
    assertThat(service.submit(LEARNER, CHOICE.key(), "TRUE").grade().verdict())
        .isEqualTo(Verdict.WRONG);
  }

  @Test
  void aSlowCorrectAnswerStaysInItsBoxAndComesBackTomorrow() {
    remember(1, Duration.ZERO);

    Feedback feedback = service.submit(LEARNER, items.get(1).key(), "answer 1", true);

    assertThat(feedback.grade().verdict()).isEqualTo(Verdict.CORRECT);
    assertThat(feedback.card().box()).isEqualTo(1);
    assertThat(feedback.card().dueAt()).isEqualTo(NOW.plus(Duration.ofDays(1)));
  }

  @Test
  void aSlowWrongAnswerIsStillWrong() {
    remember(1, Duration.ZERO);

    assertThat(service.submit(LEARNER, items.get(1).key(), "no idea", true).card().box()).isZero();
  }

  @Test
  void listsOnlyLessonsWithPatternDrills() {
    assertThat(service.lessons("business")).containsExactly(lessonOne);
  }

  @Test
  void findsALessonOrSaysThereIsNone() {
    assertThat(service.lesson("lesson-1")).isEqualTo(lessonOne);
    assertThatThrownBy(() -> service.lesson("lesson-2"))
        .isInstanceOf(LessonNotFoundException.class)
        .hasMessageContaining("lesson-2");
    assertThatThrownBy(() -> service.lesson("missing")).isInstanceOf(LessonNotFoundException.class);
  }

  @Test
  void aSelfGradeReschedulesTheCardAndReportsTheModelAnswer() {
    remember(1, Duration.ZERO);

    Feedback right = service.selfGrade(LEARNER, items.get(1).key(), Verdict.CORRECT, false);
    assertThat(right.grade().expected()).isEqualTo("answer 1");
    assertThat(right.card().box()).isEqualTo(2);

    Feedback slow = service.selfGrade(LEARNER, items.get(2).key(), Verdict.CORRECT, true);
    assertThat(slow.card().box()).isZero();

    assertThat(service.selfGrade(LEARNER, items.get(1).key(), Verdict.WRONG, false).card().box())
        .isZero();
  }

  @Test
  void aSelfGradeForAnUnknownCardFails() {
    assertThatThrownBy(
            () -> service.selfGrade(LEARNER, new CardKey("missing"), Verdict.CORRECT, false))
        .isInstanceOf(UnknownCardException.class);
  }
}
