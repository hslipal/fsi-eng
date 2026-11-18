package com.fsieng.assessment.adapter.out.llm;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Wire format of the DeepSeek chat completions API (OpenAI-compatible). */
final class DeepSeekJson {

  private DeepSeekJson() {}

  record ChatRequest(
      String model,
      List<Message> messages,
      @JsonProperty("response_format") ResponseFormat responseFormat,
      double temperature) {}

  record Message(String role, String content) {}

  record ResponseFormat(String type) {}

  record ChatResponse(@Nullable List<Choice> choices) {}

  record Choice(@Nullable Message message) {}

  /** The JSON our prompts ask the model to return. Every field may be missing. */
  record Scores(@Nullable List<Score> criteria, @Nullable String summary) {}

  record Score(@Nullable String criterion, @Nullable Double band, @Nullable String comment) {}
}
