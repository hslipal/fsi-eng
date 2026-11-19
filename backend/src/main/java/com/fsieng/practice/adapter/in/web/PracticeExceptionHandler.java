package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.InvalidPracticeException;
import com.fsieng.practice.domain.LessonNotFoundException;
import com.fsieng.practice.domain.UnknownCardException;
import java.util.Objects;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class PracticeExceptionHandler {

  @ExceptionHandler(UnknownCardException.class)
  public ProblemDetail unknownCard(UnknownCardException exception) {
    return problem(HttpStatus.NOT_FOUND, exception.getMessage());
  }

  @ExceptionHandler(LessonNotFoundException.class)
  public ProblemDetail lessonNotFound(LessonNotFoundException exception) {
    return problem(HttpStatus.NOT_FOUND, exception.getMessage());
  }

  @ExceptionHandler(InvalidPracticeException.class)
  public ProblemDetail invalidPractice(InvalidPracticeException exception) {
    return problem(HttpStatus.BAD_REQUEST, exception.getMessage());
  }

  private static ProblemDetail problem(HttpStatus status, @Nullable String message) {
    return ProblemDetail.forStatusAndDetail(
        status, Objects.requireNonNullElse(message, status.getReasonPhrase()));
  }
}
