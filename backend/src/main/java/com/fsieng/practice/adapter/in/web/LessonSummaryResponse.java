package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.Lesson;
import java.util.List;

/**
 * A lesson without its questions. Mirrors frontend LessonSummarySchema; see docs/api-contract.md.
 */
public record LessonSummaryResponse(String id, String title, String level, List<Step> steps) {

  /** How many items the lesson has of one drill type. */
  public record Step(String type, long count) {}

  static LessonSummaryResponse from(Lesson lesson) {
    List<Step> steps =
        Lesson.ORDER.stream()
            .map(type -> new Step(type, lesson.count(type)))
            .filter(step -> step.count() > 0)
            .toList();
    return new LessonSummaryResponse(lesson.id(), lesson.title(), lesson.level(), steps);
  }
}
