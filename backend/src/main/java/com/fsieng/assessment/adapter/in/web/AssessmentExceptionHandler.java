package com.fsieng.assessment.adapter.in.web;

import com.fsieng.assessment.domain.InvalidAssessmentException;
import com.fsieng.assessment.domain.ScoringUnavailableException;
import java.util.Objects;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AssessmentExceptionHandler {

  @ExceptionHandler(InvalidAssessmentException.class)
  public ProblemDetail invalid(InvalidAssessmentException exception) {
    return problem(HttpStatus.BAD_REQUEST, exception.getMessage());
  }

  @ExceptionHandler(ScoringUnavailableException.class)
  public ProblemDetail unavailable(ScoringUnavailableException exception) {
    return problem(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
  }

  private static ProblemDetail problem(HttpStatus status, @Nullable String message) {
    return ProblemDetail.forStatusAndDetail(
        status, Objects.requireNonNullElse(message, status.getReasonPhrase()));
  }
}
