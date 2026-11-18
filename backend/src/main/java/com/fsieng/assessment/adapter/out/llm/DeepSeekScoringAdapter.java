package com.fsieng.assessment.adapter.out.llm;

import com.fsieng.assessment.application.port.out.ScoringPort;
import com.fsieng.assessment.domain.Criterion;
import com.fsieng.assessment.domain.CriterionScore;
import com.fsieng.assessment.domain.EstimatedBand;
import com.fsieng.assessment.domain.InvalidAssessmentException;
import com.fsieng.assessment.domain.ScoringResult;
import com.fsieng.assessment.domain.ScoringUnavailableException;
import com.fsieng.assessment.domain.SpeakingSubmission;
import com.fsieng.assessment.domain.WritingSubmission;
import java.util.List;
import java.util.Objects;
import org.jspecify.annotations.Nullable;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Scores writing and speaking with DeepSeek chat completions in JSON mode. The model's reply is
 * untrusted: it is parsed into DTOs and every band goes through {@link EstimatedBand}.
 */
public class DeepSeekScoringAdapter implements ScoringPort {

  private static final JsonMapper JSON =
      JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();

  private final RestClient client;
  private final boolean configured;
  private final String model;
  private final ScoringPrompts prompts;

  public DeepSeekScoringAdapter(String baseUrl, String apiKey, String model) {
    this(
        RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .build(),
        !apiKey.isBlank(),
        model,
        ScoringPrompts.load());
  }

  DeepSeekScoringAdapter(
      RestClient client, boolean configured, String model, ScoringPrompts prompts) {
    this.client = client;
    this.configured = configured;
    this.model = model;
    this.prompts = prompts;
  }

  @Override
  public ScoringResult scoreWriting(WritingSubmission submission) {
    String system =
        prompts
            .writing()
            .replace("{{recommended_words}}", String.valueOf(submission.task().recommendedWords()));
    String user =
        "Task: "
            + submission.task().code()
            + "\nQuestion:\n"
            + submission.prompt()
            + "\n\nEssay ("
            + submission.words()
            + " words):\n"
            + submission.essay();
    return ask(system, user);
  }

  @Override
  public ScoringResult scoreSpeaking(SpeakingSubmission submission) {
    String user =
        "Part: "
            + submission.part()
            + "\nQuestion:\n"
            + submission.question()
            + "\n\nTranscript of the answer:\n"
            + submission.transcript();
    return ask(prompts.speaking(), user);
  }

  private ScoringResult ask(String system, String user) {
    if (!configured) {
      throw new ScoringUnavailableException("AI scoring is not configured (DEEPSEEK_API_KEY)");
    }
    DeepSeekJson.ChatRequest request =
        new DeepSeekJson.ChatRequest(
            model,
            List.of(
                new DeepSeekJson.Message("system", system), new DeepSeekJson.Message("user", user)),
            new DeepSeekJson.ResponseFormat("json_object"),
            0.0);
    try {
      DeepSeekJson.ChatResponse response =
          client
              .post()
              .uri("/chat/completions")
              .contentType(MediaType.APPLICATION_JSON)
              .body(request)
              .retrieve()
              .body(DeepSeekJson.ChatResponse.class);
      return parse(content(response));
    } catch (RestClientException e) {
      throw new ScoringUnavailableException("DeepSeek request failed: " + e.getMessage());
    }
  }

  private static String content(DeepSeekJson.@Nullable ChatResponse response) {
    List<DeepSeekJson.Choice> choices = response == null ? null : response.choices();
    if (choices == null || choices.isEmpty()) {
      throw new ScoringUnavailableException("DeepSeek returned no choices");
    }
    DeepSeekJson.Message message = choices.getFirst().message();
    if (message == null) {
      throw new ScoringUnavailableException("DeepSeek returned no message");
    }
    return message.content();
  }

  static ScoringResult parse(String content) {
    try {
      DeepSeekJson.Scores scores = JSON.readValue(content, DeepSeekJson.Scores.class);
      List<DeepSeekJson.Score> criteria = Objects.requireNonNullElse(scores.criteria(), List.of());
      return new ScoringResult(
          criteria.stream().map(DeepSeekScoringAdapter::toScore).toList(),
          Objects.requireNonNullElse(scores.summary(), ""));
    } catch (JacksonException | InvalidAssessmentException e) {
      throw new ScoringUnavailableException(
          "DeepSeek returned an unusable score: " + e.getMessage());
    }
  }

  private static CriterionScore toScore(DeepSeekJson.Score score) {
    String code = score.criterion();
    Double band = score.band();
    if (code == null || band == null) {
      throw new InvalidAssessmentException("a criterion score is missing its code or band");
    }
    return new CriterionScore(
        Criterion.fromCode(code),
        new EstimatedBand(band),
        Objects.requireNonNullElse(score.comment(), ""));
  }
}
