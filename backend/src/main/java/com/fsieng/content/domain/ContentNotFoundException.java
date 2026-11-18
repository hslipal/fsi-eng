package com.fsieng.content.domain;

import com.fsieng.common.domain.DomainException;

/** No visible content (or no sample audio) under this key. */
public final class ContentNotFoundException extends DomainException {

  public ContentNotFoundException(String what) {
    super("not found: " + what);
  }
}
