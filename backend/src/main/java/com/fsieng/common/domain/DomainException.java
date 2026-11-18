package com.fsieng.common.domain;

/** Base class of every business-rule violation. Each subclass gets an HTTP mapping. */
public abstract class DomainException extends RuntimeException {

  protected DomainException(String message) {
    super(message);
  }
}
