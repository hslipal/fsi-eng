package com.fsieng.practice.application.port.in;

import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.Feedback;
import com.fsieng.practice.domain.LearnerId;

public interface SubmitAnswerUseCase {

  Feedback submit(LearnerId learner, CardKey key, String answer);
}
