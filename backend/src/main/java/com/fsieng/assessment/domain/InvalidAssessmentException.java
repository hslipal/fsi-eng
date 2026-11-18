package com.fsieng.assessment.domain;

import com.fsieng.common.domain.DomainException;

/** The submission (or a score) breaks an assessment rule. */
public final class InvalidAssessmentException extends DomainException {

  public InvalidAssessmentException(String message) {
    super(message);
  }
}
