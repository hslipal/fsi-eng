package com.fsieng.assessment.application.service;

import com.fsieng.assessment.application.port.in.AssessSpeakingUseCase;
import com.fsieng.assessment.application.port.in.AssessWritingUseCase;
import com.fsieng.assessment.application.port.out.ScoringPort;
import com.fsieng.assessment.application.port.out.TranscriptionPort;
import com.fsieng.assessment.domain.Assessment;
import com.fsieng.assessment.domain.AudioClip;
import com.fsieng.assessment.domain.Skill;
import com.fsieng.assessment.domain.SpeakingSubmission;
import com.fsieng.assessment.domain.WritingSubmission;

public final class AssessmentService implements AssessWritingUseCase, AssessSpeakingUseCase {

  private final ScoringPort scoring;
  private final TranscriptionPort transcription;

  public AssessmentService(ScoringPort scoring, TranscriptionPort transcription) {
    this.scoring = scoring;
    this.transcription = transcription;
  }

  @Override
  public Assessment assessWriting(WritingSubmission submission) {
    return Assessment.of(Skill.WRITING, scoring.scoreWriting(submission), null);
  }

  @Override
  public Assessment assessSpeaking(int part, String question, AudioClip recording) {
    String transcript = transcription.transcribe(recording);
    SpeakingSubmission submission = new SpeakingSubmission(part, question, transcript);
    return Assessment.of(Skill.SPEAKING, scoring.scoreSpeaking(submission), transcript);
  }
}
