package com.fsieng.assessment.adapter.out.asr;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fsieng.assessment.domain.AudioClip;
import com.fsieng.assessment.domain.ScoringUnavailableException;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class DeepSeekTranscriptionAdapterTest {

  private static final String BASE = "https://deepseek.test";
  private static final AudioClip CLIP = new AudioClip(new byte[] {1, 2, 3}, "answer.wav");

  private final RestClient.Builder builder = RestClient.builder().baseUrl(BASE);
  private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  private final DeepSeekTranscriptionAdapter adapter =
      new DeepSeekTranscriptionAdapter(builder.build(), true);

  @Test
  void uploadsTheRecordingAndReturnsTheText() {
    server
        .expect(requestTo(BASE + "/v1/tools/asr"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("Content-Type", Matchers.startsWith("multipart/form-data")))
        .andRespond(
            withSuccess(
                "{\"request_id\":\"r\",\"text\":\"I usually work from"
                    + " home.\",\"duration_ms\":3200}",
                MediaType.APPLICATION_JSON));

    assertThat(adapter.transcribe(CLIP)).isEqualTo("I usually work from home.");
    server.verify();
  }

  @Test
  void failsWhenThereIsNoText() {
    server
        .expect(requestTo(BASE + "/v1/tools/asr"))
        .andRespond(withSuccess("{\"request_id\":\"r\"}", MediaType.APPLICATION_JSON));

    assertThatThrownBy(() -> adapter.transcribe(CLIP))
        .isInstanceOf(ScoringUnavailableException.class)
        .hasMessageContaining("no text");
  }

  @Test
  void reportsServerErrorsAndMissingConfiguration() {
    server.expect(requestTo(BASE + "/v1/tools/asr")).andRespond(withServerError());

    assertThatThrownBy(() -> adapter.transcribe(CLIP))
        .isInstanceOf(ScoringUnavailableException.class);
    assertThatThrownBy(() -> new DeepSeekTranscriptionAdapter(BASE, " ").transcribe(CLIP))
        .isInstanceOf(ScoringUnavailableException.class)
        .hasMessageContaining("DEEPSEEK_API_KEY");
  }
}
