package com.fsieng.practice.domain;

import com.fsieng.common.domain.DomainException;

/** A practice value (card key, learner id, box) breaks a rule. */
public final class InvalidPracticeException extends DomainException {

  public InvalidPracticeException(String message) {
    super(message);
  }
}
