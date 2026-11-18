package com.fsieng.assessment.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

/** Without DEEPSEEK_API_KEY the endpoints validate input and then answer 503. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "fsi.deepseek.api-key=")
class AssessmentApiIntegrationTest {

  private final RestClient client;

  AssessmentApiIntegrationTest(@Value("${local.server.port}") int port) {
    this.client = RestClient.create("http://localhost:" + port);
  }

  private int postJson(Map<String, Object> body) {
    return client
        .post()
        .uri("/api/assessment/writing")
        .contentType(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve()
        .onStatus(HttpStatusCode::isError, (_, _) -> {})
        .toBodilessEntity()
        .getStatusCode()
        .value();
  }

  private int postSpeaking(String part, byte[] audio) {
    MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
    form.add("part", part);
    form.add("question", "Do you work from home?");
    form.add(
        "audio",
        new ByteArrayResource(audio) {
          @Override
          public String getFilename() {
            return "answer.wav";
          }
        });
    return client
        .post()
        .uri("/api/assessment/speaking")
        .contentType(MediaType.MULTIPART_FORM_DATA)
        .body(form)
        .retrieve()
        .onStatus(HttpStatusCode::isError, (_, _) -> {})
        .toBodilessEntity()
        .getStatusCode()
        .value();
  }

  @Test
  void validWritingWithoutAKeyIsServiceUnavailable() {
    int status =
        postJson(Map.of("task", "task-2", "prompt", "Discuss.", "essay", "word ".repeat(30)));

    assertThat(status).isEqualTo(503);
  }

  @Test
  void invalidWritingIsABadRequest() {
    assertThat(postJson(Map.of("task", "task-2", "prompt", "Discuss.", "essay", "too short")))
        .isEqualTo(400);
    assertThat(
            postJson(Map.of("task", "task-9", "prompt", "Discuss.", "essay", "word ".repeat(30))))
        .isEqualTo(400);
    assertThat(postJson(Map.of("task", "task-2", "prompt", " ", "essay", "word ".repeat(30))))
        .isEqualTo(400);
  }

  @Test
  void speakingIsValidatedThenNeedsTheKey() {
    assertThat(postSpeaking("1", new byte[] {1, 2, 3})).isEqualTo(503);
    assertThat(postSpeaking("1", new byte[0])).isEqualTo(400);
  }
}
