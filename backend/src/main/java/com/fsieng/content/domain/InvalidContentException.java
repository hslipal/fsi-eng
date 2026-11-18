package com.fsieng.content.domain;

import com.fsieng.common.domain.DomainException;

/** A content item, track or license value breaks a content rule. */
public final class InvalidContentException extends DomainException {

  public InvalidContentException(String message) {
    super(message);
  }
}
