package com.fsieng.content.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.adapter.out.persistence.ContentItemEntity;
import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ContentApiIntegrationTest {

  private final ContentItemJpaRepository repository;
  private final RestClient client;

  ContentApiIntegrationTest(
      @Autowired ContentItemJpaRepository repository, @Value("${local.server.port}") int port) {
    this.repository = repository;
    this.client = RestClient.create("http://localhost:" + port);
  }

  private List<Map<String, Object>> fetch(String uri) {
    return Objects.requireNonNull(
        client
            .get()
            .uri(uri)
            .retrieve()
            .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {}));
  }

  @BeforeEach
  void seed() {
    repository.deleteAll();
    repository.save(
        new ContentItemEntity(UUID.randomUUID(), "business", "Asking for a quote", "ILR 2")
            .withLicense("generated", "deepseek")
            .reviewedBy("admin"));
    repository.save(
        new ContentItemEntity(UUID.randomUUID(), "business", "BEC past paper", "ILR 3")
            .withSource("https://example.com/bec")
            .withLicense("dev-only", null)
            .reviewedBy("admin"));
    repository.save(
        new ContentItemEntity(UUID.randomUUID(), "ielts", "Unreviewed essay prompt", "6.5")
            .withLicense("generated", "deepseek"));
  }

  @Test
  void listsOnlyPublishedItemsOfTheTrack() {
    List<Map<String, Object>> items = fetch("/api/content/items?track=business");

    assertThat(items).hasSize(1);
    assertThat(items.getFirst())
        .containsEntry("title", "Asking for a quote")
        .containsEntry("track", "business")
        .containsEntry("license", "generated")
        .containsEntry("level", "ILR 2");
  }

  @Test
  void unreviewedItemsStayHidden() {
    List<Map<String, Object>> items = fetch("/api/content/items?track=ielts");

    assertThat(items).isEmpty();
  }

  @Test
  void unknownTrackIsABadRequest() {
    HttpStatusCode status =
        client
            .get()
            .uri("/api/content/items?track=toefl")
            .retrieve()
            .onStatus(HttpStatusCode::isError, (_, _) -> {})
            .toBodilessEntity()
            .getStatusCode();

    assertThat(status.value()).isEqualTo(400);
  }
}
