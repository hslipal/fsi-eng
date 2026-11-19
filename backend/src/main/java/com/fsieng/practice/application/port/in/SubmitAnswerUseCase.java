package com.fsieng.practice.application.port.in;

import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.Feedback;
import com.fsieng.practice.domain.LearnerId;

public interface SubmitAnswerUseCase {

  /**
   * Grades an answer and reschedules the card. A slow answer (the learner missed the time limit of
   * a timed drill) is not yet automatic: even when correct it stays in its box and comes back the
   * next day.
   */
  Feedback submit(LearnerId learner, CardKey key, String answer, boolean slow);

  default Feedback submit(LearnerId learner, CardKey key, String answer) {
    return submit(learner, key, answer, false);
  }
}
