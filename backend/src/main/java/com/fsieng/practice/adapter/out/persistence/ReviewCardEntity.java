package com.fsieng.practice.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** JPA row of a Leitner card. (learner_id, card_key) is unique. */
@Entity
@Table(name = "review_card")
public class ReviewCardEntity {

  @Id private UUID id = new UUID(0L, 0L);

  @Column(name = "learner_id", nullable = false)
  private String learnerId = "";

  @Column(name = "card_key", nullable = false)
  private String cardKey = "";

  @Column(nullable = false)
  private int box;

  @Column(name = "due_at", nullable = false)
  private Instant dueAt = Instant.EPOCH;

  protected ReviewCardEntity() {}

  public ReviewCardEntity(UUID id, String learnerId, String cardKey) {
    this.id = id;
    this.learnerId = learnerId;
    this.cardKey = cardKey;
  }

  public ReviewCardEntity schedule(int newBox, Instant newDueAt) {
    this.box = newBox;
    this.dueAt = newDueAt;
    return this;
  }

  public UUID getId() {
    return id;
  }

  public String getLearnerId() {
    return learnerId;
  }

  public String getCardKey() {
    return cardKey;
  }

  public int getBox() {
    return box;
  }

  public Instant getDueAt() {
    return dueAt;
  }
}
