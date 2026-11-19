package com.fsieng.content.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import com.fsieng.content.application.port.in.ImportContentUseCase;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

/** With the dev switch on, dev-only speaking questions and their sample audio are served. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "fsi.content.dir=src/test/resources/content-fixture",
      "fsi.content.dev-dir=src/test/resources/content-dev-fixture",
      "fsi.content.include-dev-only=true"
    })
class SpeakingPromptsIntegrationTest {

  private static final String KEY = "9a1b2c3d-0000-4000-8000-0000000000dd:0:0";

  private final ContentItemJpaRepository repository;
  private final ImportContentUseCase importContent;
  private final RestClient client;

  SpeakingPromptsIntegrationTest(
      @Autowired ContentItemJpaRepository repository,
      @Autowired ImportContentUseCase importContent,
      @Value("${local.server.port}") int port) {
    this.repository = repository;
    this.importContent = importContent;
    this.client = RestClient.create("http://localhost:" + port);
  }

  @Test
  void servesDevOnlyQuestionsAndTheirSampleAudio() {
    repository.deleteAll();
    importContent.importAll();

    List<Map<String, Object>> prompts =
        Objects.requireNonNull(
            client
                .get()
                .uri("/api/content/speaking-prompts")
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {}));
    ResponseEntity<byte[]> sample =
        client
            .get()
            .uri("/api/content/speaking-prompts/" + KEY + "/sample")
            .retrieve()
            .toEntity(byte[].class);
    int missing =
        client
            .get()
            .uri("/api/content/speaking-prompts/nope/sample")
            .retrieve()
            .onStatus(HttpStatusCode::isError, (_, _) -> {})
            .toBodilessEntity()
            .getStatusCode()
            .value();

    assertThat(prompts).hasSize(2);
    assertThat(prompts.getFirst())
        .containsEntry("key", KEY)
        .containsEntry("part", 1)
        .containsEntry("question", "Do you like your job?")
        .containsEntry("hasSample", true)
        .containsEntry("devOnly", true);
    assertThat(sample.getHeaders().getContentType()).hasToString("audio/mpeg");
    assertThat(new String(Objects.requireNonNull(sample.getBody()), StandardCharsets.UTF_8))
        .isEqualTo("ID3-fake-sample");
    assertThat(missing).isEqualTo(404);
  }

  @Test
  void servesSubtitlesWithTheirTranslation() {
    repository.deleteAll();
    importContent.importAll();

    Map<String, Object> subtitles =
        Objects.requireNonNull(
            client
                .get()
                .uri("/api/content/speaking-prompts/" + KEY + "/subtitles")
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {}));

    List<?> lines = (List<?>) Objects.requireNonNull(subtitles.get("lines"));
    assertThat(lines).hasSize(2);
    Map<?, ?> first = (Map<?, ?>) lines.getFirst();
    Map<?, ?> second = (Map<?, ?>) lines.get(1);
    assertThat(first.get("start")).isEqualTo(0.0);
    assertThat(first.get("end")).isEqualTo(2.5);
    assertThat(first.get("text")).isEqualTo("Yes, I really enjoy my job.");
    assertThat(first.get("translation")).isEqualTo("是的，我很喜欢我的工作。");
    assertThat(second.get("text")).isEqualTo("I work with friendly people.");
    assertThat(second.containsKey("translation")).isTrue();
    assertThat(second.get("translation")).isNull();
  }
}
