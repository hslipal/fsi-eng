package com.fsieng.practice.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.adapter.out.persistence.ContentItemEntity;
import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import com.fsieng.practice.adapter.out.persistence.ReviewCardJpaRepository;
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
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PracticeApiIntegrationTest {

  private static final UUID CONTENT_ID = UUID.fromString("9a1b2c3d-0000-4000-8000-0000000000aa");
  private static final String DRILLS =
      """
      [{"type": "substitution", "instruction": "Replace the document.",
        "model": "Could you send me the quote by Friday?",
        "items": [{"cue": "contract", "answers": ["Could you send me the contract by Friday?"]},
                  {"cue": "invoice", "answers": ["Could you send me the invoice by Friday?"]}]}]
      """;

  private final ContentItemJpaRepository content;
  private final ReviewCardJpaRepository reviewCards;
  private final RestClient client;

  PracticeApiIntegrationTest(
      @Autowired ContentItemJpaRepository content,
      @Autowired ReviewCardJpaRepository reviewCards,
      @Value("${local.server.port}") int port) {
    this.content = content;
    this.reviewCards = reviewCards;
    this.client = RestClient.create("http://localhost:" + port);
  }

  @BeforeEach
  void seed() {
    reviewCards.deleteAll();
    content.deleteAll();
    content.save(
        new ContentItemEntity(CONTENT_ID, "business", "Requesting a quote", "ILR 1+")
            .withLicense("generated", "claude")
            .reviewedBy("admin")
            .withDrills(DRILLS));
  }

  private List<Map<String, Object>> cards(String learner) {
    return Objects.requireNonNull(
        client
            .get()
            .uri("/api/practice/cards?track=business")
            .header("X-Learner-Id", learner)
            .retrieve()
            .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {}));
  }

  private Map<String, Object> answer(String learner, String cardKey, String text) {
    return Objects.requireNonNull(
        client
            .post()
            .uri("/api/practice/answers")
            .header("X-Learner-Id", learner)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("cardKey", cardKey, "answer", text))
            .retrieve()
            .body(new ParameterizedTypeReference<Map<String, Object>>() {}));
  }

  private int status(String path, Map<String, Object> body) {
    return client
        .post()
        .uri(path)
        .contentType(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve()
        .onStatus(HttpStatusCode::isError, (_, _) -> {})
        .toBodilessEntity()
        .getStatusCode()
        .value();
  }

  @Test
  void cardsComeWithoutAnswers() {
    List<Map<String, Object>> cards = cards("ana");

    assertThat(cards).hasSize(2);
    assertThat(cards.getFirst())
        .containsEntry("cardKey", CONTENT_ID + ":0:0")
        .containsEntry("cue", "contract")
        .containsEntry("type", "substitution")
        .doesNotContainKey("answers");
  }

  @Test
  void aCorrectAnswerSchedulesTheCardAndHidesItUntilDue() {
    String key = CONTENT_ID + ":0:0";

    Map<String, Object> feedback = answer("ana", key, "could you send me the contract by friday");

    assertThat(feedback)
        .containsEntry("verdict", "correct")
        .containsEntry("expected", "Could you send me the contract by Friday?")
        .containsEntry("box", 1);
    assertThat(cards("ana"))
        .extracting(card -> String.valueOf(card.get("cue")))
        .containsExactly("invoice");
    assertThat(cards("ben")).hasSize(2);
  }

  @Test
  void aWrongAnswerShowsTheExpectedAnswer() {
    Map<String, Object> feedback = answer("ana", CONTENT_ID + ":0:1", "I need money");

    assertThat(feedback)
        .containsEntry("verdict", "wrong")
        .containsEntry("expected", "Could you send me the invoice by Friday?")
        .containsEntry("box", 0);
  }

  @Test
  void rejectsUnknownCardsAndBlankAnswers() {
    assertThat(status("/api/practice/answers", Map.of("cardKey", "nope", "answer", "x")))
        .isEqualTo(404);
    assertThat(status("/api/practice/answers", Map.of("cardKey", "nope", "answer", " ")))
        .isEqualTo(400);
  }

  @Test
  void rejectsAnOutOfRangeLimitAndABadLearnerId() {
    int limit =
        client
            .get()
            .uri("/api/practice/cards?track=business&limit=0")
            .retrieve()
            .onStatus(HttpStatusCode::isError, (_, _) -> {})
            .toBodilessEntity()
            .getStatusCode()
            .value();
    int learner =
        client
            .get()
            .uri("/api/practice/cards?track=business")
            .header("X-Learner-Id", "x".repeat(101))
            .retrieve()
            .onStatus(HttpStatusCode::isError, (_, _) -> {})
            .toBodilessEntity()
            .getStatusCode()
            .value();

    assertThat(limit).isEqualTo(400);
    assertThat(learner).isEqualTo(400);
  }
}
