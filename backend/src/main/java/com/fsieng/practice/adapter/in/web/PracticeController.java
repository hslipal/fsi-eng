package com.fsieng.practice.adapter.in.web;

import com.fsieng.practice.application.port.in.GetDueCardsUseCase;
import com.fsieng.practice.application.port.in.GetLessonsUseCase;
import com.fsieng.practice.application.port.in.SubmitAnswerUseCase;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.LearnerId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Practice API. Until login exists the learner is identified by the X-Learner-Id header (default
 * "local"); this is not authentication.
 */
@RestController
@RequestMapping("/api/practice")
public class PracticeController {

  private static final String LEARNER_HEADER = "X-Learner-Id";
  private static final String DEFAULT_LEARNER = "local";

  private final GetDueCardsUseCase dueCards;
  private final SubmitAnswerUseCase submitAnswer;
  private final GetLessonsUseCase lessons;

  public PracticeController(
      GetDueCardsUseCase dueCards, SubmitAnswerUseCase submitAnswer, GetLessonsUseCase lessons) {
    this.dueCards = dueCards;
    this.submitAnswer = submitAnswer;
    this.lessons = lessons;
  }

  @GetMapping("/cards")
  public List<CardResponse> cards(
      @RequestHeader(name = LEARNER_HEADER, defaultValue = DEFAULT_LEARNER) String learner,
      @RequestParam("track") String track,
      @RequestParam(name = "limit", defaultValue = "10") @Min(1) @Max(50) int limit) {
    return dueCards.dueCards(new LearnerId(learner), track, limit).stream()
        .map(CardResponse::from)
        .toList();
  }

  @PostMapping("/answers")
  public FeedbackResponse answer(
      @RequestHeader(name = LEARNER_HEADER, defaultValue = DEFAULT_LEARNER) String learner,
      @Valid @RequestBody AnswerRequest request) {
    return FeedbackResponse.from(
        submitAnswer.submit(
            new LearnerId(learner),
            new CardKey(request.cardKey()),
            request.answer(),
            request.isSlow()));
  }

  @GetMapping("/lessons")
  public List<LessonSummaryResponse> lessons(@RequestParam("track") String track) {
    return lessons.lessons(track).stream().map(LessonSummaryResponse::from).toList();
  }

  @GetMapping("/lessons/{id}")
  public LessonResponse lesson(@PathVariable("id") String id) {
    return LessonResponse.from(lessons.lesson(id));
  }
}
