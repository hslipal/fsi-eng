package com.fsieng.practice.domain;

import com.fsieng.common.domain.DomainException;

/** The card key does not point to a published drill item. */
public final class UnknownCardException extends DomainException {

  public UnknownCardException(CardKey key) {
    super("unknown card: " + key.value());
  }
}
