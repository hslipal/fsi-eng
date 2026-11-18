package com.fsieng.assessment.application.port.out;

import com.fsieng.assessment.domain.ScoringResult;
import com.fsieng.assessment.domain.SpeakingSubmission;
import com.fsieng.assessment.domain.WritingSubmission;

/** Asks a language model for criterion scores. Implemented only in adapter.out.llm. */
public interface ScoringPort {

  ScoringResult scoreWriting(WritingSubmission submission);

  ScoringResult scoreSpeaking(SpeakingSubmission submission);
}
