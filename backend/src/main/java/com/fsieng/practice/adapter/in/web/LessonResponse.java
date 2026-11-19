package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.Lesson;
import java.util.List;

/** A lesson with its questions in practice order. Mirrors frontend LessonSchema. */
public record LessonResponse(String id, String title, String level, List<CardResponse> cards) {

  static LessonResponse from(Lesson lesson) {
    return new LessonResponse(
        lesson.id(),
        lesson.title(),
        lesson.level(),
        lesson.items().stream().map(CardResponse::from).toList());
  }
}
