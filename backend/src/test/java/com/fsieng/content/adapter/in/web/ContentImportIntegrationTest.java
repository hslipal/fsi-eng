package com.fsieng.content.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import com.fsieng.content.application.port.in.ImportContentUseCase;
import com.fsieng.content.domain.ContentImportReport;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "fsi.content.dir=src/test/resources/content-fixture",
      "fsi.content.import-on-startup=true"
    })
class ContentImportIntegrationTest {

  private final ContentItemJpaRepository repository;
  private final ImportContentUseCase importContent;
  private final RestClient client;

  ContentImportIntegrationTest(
      @Autowired ContentItemJpaRepository repository,
      @Autowired ImportContentUseCase importContent,
      @Value("${local.server.port}") int port) {
    this.repository = repository;
    this.importContent = importContent;
    this.client = RestClient.create("http://localhost:" + port);
  }

  @Test
  void importedReviewedFilesAreServedAndDraftsAreNot() {
    repository.deleteAll();

    ContentImportReport report = importContent.importAll();
    List<Map<String, Object>> items =
        Objects.requireNonNull(
            client
                .get()
                .uri("/api/content/items?track=business")
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {}));

    assertThat(report.imported()).isEqualTo(1);
    assertThat(items).hasSize(1);
    assertThat(items.getFirst()).containsEntry("title", "Asking for a quote by Friday");
    assertThat(repository.count()).isEqualTo(1);
  }
}
