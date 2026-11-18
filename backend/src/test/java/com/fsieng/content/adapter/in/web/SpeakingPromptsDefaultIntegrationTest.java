package com.fsieng.content.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.adapter.out.persistence.ContentItemEntity;
import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

/** Without the dev profile, dev-only material is never served, even if it is in the database. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SpeakingPromptsDefaultIntegrationTest {

  private static final String DRILLS =
      "[{\"type\":\"speaking\",\"instruction\":\"Answer.\","
          + "\"items\":[{\"cue\":\"Do you like your job?\",\"part\":1}]}]";

  private final ContentItemJpaRepository repository;
  private final RestClient client;

  SpeakingPromptsDefaultIntegrationTest(
      @Autowired ContentItemJpaRepository repository, @Value("${local.server.port}") int port) {
    this.repository = repository;
    this.client = RestClient.create("http://localhost:" + port);
  }

  @Test
  void devOnlyQuestionsStayHidden() {
    repository.deleteAll();
    repository.save(
        new ContentItemEntity(UUID.randomUUID(), "ielts", "Copyrighted samples", "band 6.5")
            .withLicense("dev-only", null)
            .withDrills(DRILLS));

    List<Map<String, Object>> prompts =
        Objects.requireNonNull(
            client
                .get()
                .uri("/api/content/speaking-prompts")
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {}));

    assertThat(prompts).isEmpty();
  }
}
