package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.domain.Feedback;

/** Mirrors frontend FeedbackSchema; see docs/api-contract.md. */
public record FeedbackResponse(String verdict, String expected, int box, String nextReviewAt) {

  static FeedbackResponse from(Feedback feedback) {
    return new FeedbackResponse(
        feedback.grade().verdict().code(),
        feedback.grade().expected(),
        feedback.card().box(),
        feedback.card().dueAt().toString());
  }
}
