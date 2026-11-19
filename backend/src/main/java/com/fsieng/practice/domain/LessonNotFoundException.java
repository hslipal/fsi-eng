package com.fsieng.practice.domain;

import com.fsieng.common.domain.DomainException;

/** No published content item with this id has pattern drills. */
public final class LessonNotFoundException extends DomainException {

  public LessonNotFoundException(String id) {
    super("no lesson " + id);
  }
}
