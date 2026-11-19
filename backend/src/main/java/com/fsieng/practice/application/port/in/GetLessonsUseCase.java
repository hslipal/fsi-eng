package com.fsieng.practice.application.port.in;

import com.fsieng.practice.domain.Lesson;
import java.util.List;

public interface GetLessonsUseCase {

  /** Published content items of a track that have at least one pattern drill. */
  List<Lesson> lessons(String track);

  /** One lesson; throws {@code LessonNotFoundException} when there is none with this id. */
  Lesson lesson(String id);
}
