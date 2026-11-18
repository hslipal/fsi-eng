package com.fsieng.practice.application.port.in;

import com.fsieng.practice.domain.LearnerId;
import com.fsieng.practice.domain.PracticeItem;
import java.util.List;

public interface GetDueCardsUseCase {

  /** Due reviews first (oldest first), then items the learner has never seen. */
  List<PracticeItem> dueCards(LearnerId learner, String track, int limit);
}
