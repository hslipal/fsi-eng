package com.fsieng.assessment.application.port.in;

import com.fsieng.assessment.domain.Assessment;
import com.fsieng.assessment.domain.WritingSubmission;

public interface AssessWritingUseCase {

  Assessment assessWriting(WritingSubmission submission);
}
