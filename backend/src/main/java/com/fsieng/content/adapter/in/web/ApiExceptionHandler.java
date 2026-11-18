package com.fsieng.content.adapter.in.web;

import com.fsieng.content.domain.ContentNotFoundException;
import com.fsieng.content.domain.InvalidContentException;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ContentNotFoundException.class)
  public ProblemDetail notFound(ContentNotFoundException exception) {
    String detail = Objects.requireNonNullElse(exception.getMessage(), "not found");
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detail);
  }

  @ExceptionHandler(InvalidContentException.class)
  public ProblemDetail invalidContent(InvalidContentException exception) {
    String detail = Objects.requireNonNullElse(exception.getMessage(), "invalid content");
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
  }
}
