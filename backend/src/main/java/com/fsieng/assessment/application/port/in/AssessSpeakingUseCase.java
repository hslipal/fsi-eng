package com.fsieng.assessment.application.port.in;

import com.fsieng.assessment.domain.Assessment;
import com.fsieng.assessment.domain.AudioClip;

public interface AssessSpeakingUseCase {

  /** Transcribes the recording, then estimates every speaking criterion except pronunciation. */
  Assessment assessSpeaking(int part, String question, AudioClip recording);
}
