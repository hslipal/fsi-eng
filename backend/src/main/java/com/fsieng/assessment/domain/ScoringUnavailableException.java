package com.fsieng.assessment.domain;

import com.fsieng.common.domain.DomainException;

/** The AI service is not configured, not reachable, or returned something unusable. */
public final class ScoringUnavailableException extends DomainException {

  public ScoringUnavailableException(String message) {
    super(message);
  }
}
