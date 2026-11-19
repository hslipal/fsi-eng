package com.fsieng.practice.application.port.in;

import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.Feedback;
import com.fsieng.practice.domain.LearnerId;
import com.fsieng.practice.domain.Verdict;

public interface SubmitAnswerUseCase {

  /**
   * Grades an answer and reschedules the card. A slow answer (the learner missed the time limit of
   * a timed drill) is not yet automatic: even when correct it stays in its box and comes back the
   * next day.
   */
  Feedback submit(LearnerId learner, CardKey key, String answer, boolean slow);

  /**
   * Reschedules the card with the learner's own verdict (FSI tape style: the learner says the
   * answer aloud, hears the model answer and marks themselves). Slow works as for {@link #submit}.
   */
  Feedback selfGrade(LearnerId learner, CardKey key, Verdict verdict, boolean slow);

  default Feedback submit(LearnerId learner, CardKey key, String answer) {
    return submit(learner, key, answer, false);
  }
}
