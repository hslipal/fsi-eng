package com.fsieng.practice.application.service;

import com.fsieng.practice.application.port.in.GetDueCardsUseCase;
import com.fsieng.practice.application.port.in.SubmitAnswerUseCase;
import com.fsieng.practice.application.port.out.DrillCatalogPort;
import com.fsieng.practice.application.port.out.ReviewCardStorePort;
import com.fsieng.practice.domain.AnswerGrader;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.Feedback;
import com.fsieng.practice.domain.Grade;
import com.fsieng.practice.domain.LearnerId;
import com.fsieng.practice.domain.PracticeItem;
import com.fsieng.practice.domain.ReviewCard;
import com.fsieng.practice.domain.UnknownCardException;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class PracticeService implements GetDueCardsUseCase, SubmitAnswerUseCase {

  private final DrillCatalogPort catalog;
  private final ReviewCardStorePort cards;
  private final AnswerGrader grader;
  private final Clock clock;

  public PracticeService(
      DrillCatalogPort catalog, ReviewCardStorePort cards, AnswerGrader grader, Clock clock) {
    this.catalog = catalog;
    this.cards = cards;
    this.grader = grader;
    this.clock = clock;
  }

  @Override
  public List<PracticeItem> dueCards(LearnerId learner, String track, int limit) {
    Instant now = clock.instant();
    List<PracticeItem> catalogItems = catalog.itemsFor(track);
    Map<CardKey, PracticeItem> byKey =
        catalogItems.stream()
            .collect(Collectors.toMap(PracticeItem::key, Function.identity(), (a, b) -> a));
    List<ReviewCard> known = cards.findAll(learner);
    Set<CardKey> seen = known.stream().map(ReviewCard::key).collect(Collectors.toSet());

    Stream<PracticeItem> due =
        known.stream()
            .filter(card -> card.isDue(now))
            .sorted(Comparator.comparing(ReviewCard::dueAt))
            .flatMap(card -> Optional.ofNullable(byKey.get(card.key())).stream());
    Stream<PracticeItem> unseen = catalogItems.stream().filter(item -> !seen.contains(item.key()));
    return Stream.concat(due, unseen).limit(limit).toList();
  }

  @Override
  public Feedback submit(LearnerId learner, CardKey key, String answer) {
    PracticeItem item = catalog.find(key).orElseThrow(() -> new UnknownCardException(key));
    Instant now = clock.instant();
    Grade grade = grader.grade(answer, item.answers());
    ReviewCard before =
        cards.find(learner, key).orElseGet(() -> ReviewCard.fresh(learner, key, now));
    ReviewCard after = before.after(grade.verdict(), now);
    cards.save(after);
    return new Feedback(grade, after);
  }
}
