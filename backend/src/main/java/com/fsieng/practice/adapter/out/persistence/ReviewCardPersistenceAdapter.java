package com.fsieng.practice.adapter.out.persistence;

import com.fsieng.practice.application.port.out.ReviewCardStorePort;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.LearnerId;
import com.fsieng.practice.domain.ReviewCard;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class ReviewCardPersistenceAdapter implements ReviewCardStorePort {

  private final ReviewCardJpaRepository repository;

  public ReviewCardPersistenceAdapter(ReviewCardJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<ReviewCard> find(LearnerId learner, CardKey key) {
    return repository
        .findByLearnerIdAndCardKey(learner.value(), key.value())
        .map(ReviewCardPersistenceAdapter::toDomain);
  }

  @Override
  public List<ReviewCard> findAll(LearnerId learner) {
    return repository.findByLearnerId(learner.value()).stream()
        .map(ReviewCardPersistenceAdapter::toDomain)
        .toList();
  }

  @Override
  public void save(ReviewCard card) {
    ReviewCardEntity entity =
        repository
            .findByLearnerIdAndCardKey(card.learner().value(), card.key().value())
            .orElseGet(
                () ->
                    new ReviewCardEntity(
                        UUID.randomUUID(), card.learner().value(), card.key().value()));
    repository.save(entity.schedule(card.box(), card.dueAt()));
  }

  private static ReviewCard toDomain(ReviewCardEntity entity) {
    return new ReviewCard(
        new LearnerId(entity.getLearnerId()),
        new CardKey(entity.getCardKey()),
        entity.getBox(),
        entity.getDueAt());
  }
}
