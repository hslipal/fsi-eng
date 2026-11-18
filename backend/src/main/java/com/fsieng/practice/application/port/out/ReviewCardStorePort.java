package com.fsieng.practice.application.port.out;

import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.LearnerId;
import com.fsieng.practice.domain.ReviewCard;
import java.util.List;
import java.util.Optional;

public interface ReviewCardStorePort {

  Optional<ReviewCard> find(LearnerId learner, CardKey key);

  /** Every card of the learner, any due date. */
  List<ReviewCard> findAll(LearnerId learner);

  void save(ReviewCard card);
}
