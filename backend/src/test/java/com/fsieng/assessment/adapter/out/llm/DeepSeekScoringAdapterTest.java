package com.fsieng.assessment.adapter.out.llm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fsieng.assessment.domain.Criterion;
import com.fsieng.assessment.domain.EstimatedBand;
import com.fsieng.assessment.domain.ScoringResult;
import com.fsieng.assessment.domain.ScoringUnavailableException;
import com.fsieng.assessment.domain.SpeakingSubmission;
import com.fsieng.assessment.domain.WritingSubmission;
import com.fsieng.assessment.domain.WritingTask;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** Uses recorded DeepSeek responses from src/test/resources/llm-fixtures; no network. */
class DeepSeekScoringAdapterTest {

  private static final String BASE = "https://deepseek.test";
  private static final WritingSubmission ESSAY =
      new WritingSubmission(WritingTask.TASK_2, "Discuss both views.", "word ".repeat(40));

  private final RestClient.Builder builder =
      RestClient.builder().baseUrl(BASE).defaultHeader("Authorization", "Bearer test-key");
  private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  private final DeepSeekScoringAdapter adapter =
      new DeepSeekScoringAdapter(
          builder.build(),
          true,
          "deepseek-chat",
          new ScoringPrompts("Return json. Target {{recommended_words}} words.", "Speaking json."));

  static String fixture(String name) {
    try (InputStream in =
        DeepSeekScoringAdapterTest.class.getResourceAsStream("/llm-fixtures/" + name)) {
      return new String(Objects.requireNonNull(in).readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  private void reply(String fixture) {
    server
        .expect(requestTo(BASE + "/chat/completions"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("Authorization", "Bearer test-key"))
        .andExpect(jsonPath("$.model").value("deepseek-chat"))
        .andExpect(jsonPath("$.response_format.type").value("json_object"))
        .andExpect(jsonPath("$.messages[0].content").value(Matchers.containsString("250 words")))
        .andRespond(withSuccess(fixture(fixture), MediaType.APPLICATION_JSON));
  }

  @Test
  void parsesARecordedWritingScore() {
    reply("writing-ok.json");

    ScoringResult result = adapter.scoreWriting(ESSAY);

    assertThat(result.criteria()).hasSize(4);
    assertThat(result.criteria().getFirst().criterion()).isEqualTo(Criterion.TASK_RESPONSE);
    assertThat(result.criteria().get(3).band()).isEqualTo(new EstimatedBand(5.5));
    assertThat(result.summary()).isEqualTo("先补充论据，再练习复合句。");
    server.verify();
  }

  @Test
  void rejectsBandsOutsideTheScale() {
    reply("writing-bad-band.json");

    assertThatThrownBy(() -> adapter.scoreWriting(ESSAY))
        .isInstanceOf(ScoringUnavailableException.class)
        .hasMessageContaining("9.7");
  }

  @Test
  void rejectsRepliesThatAreNotJson() {
    reply("not-json.json");

    assertThatThrownBy(() -> adapter.scoreWriting(ESSAY))
        .isInstanceOf(ScoringUnavailableException.class);
  }

  @Test
  void rejectsRepliesWithoutChoices() {
    reply("no-choices.json");

    assertThatThrownBy(() -> adapter.scoreWriting(ESSAY))
        .isInstanceOf(ScoringUnavailableException.class)
        .hasMessageContaining("no choices");
  }

  @Test
  void reportsServerErrors() {
    server.expect(requestTo(BASE + "/chat/completions")).andRespond(withServerError());

    assertThatThrownBy(() -> adapter.scoreWriting(ESSAY))
        .isInstanceOf(ScoringUnavailableException.class)
        .hasMessageContaining("request failed");
  }

  @Test
  void scoresSpeakingFromTheTranscript() {
    server
        .expect(requestTo(BASE + "/chat/completions"))
        .andExpect(jsonPath("$.messages[1].content").value(Matchers.containsString("Fridays")))
        .andRespond(withSuccess(fixture("speaking-ok.json"), MediaType.APPLICATION_JSON));

    ScoringResult result =
        adapter.scoreSpeaking(new SpeakingSubmission(1, "Do you work from home?", "On Fridays."));

    assertThat(result.criteria()).hasSize(3);
  }

  @Test
  void refusesToRunWithoutAnApiKey() {
    DeepSeekScoringAdapter unconfigured = new DeepSeekScoringAdapter(BASE, "", "deepseek-chat");

    assertThatThrownBy(() -> unconfigured.scoreWriting(ESSAY))
        .isInstanceOf(ScoringUnavailableException.class)
        .hasMessageContaining("DEEPSEEK_API_KEY");
  }

  @Test
  void theProtectedPromptsArePackaged() {
    ScoringPrompts prompts = ScoringPrompts.load();

    assertThat(prompts.writing()).contains("json").contains("{{recommended_words}}");
    assertThat(prompts.speaking()).contains("json").contains("Do NOT score pronunciation");
  }
}
