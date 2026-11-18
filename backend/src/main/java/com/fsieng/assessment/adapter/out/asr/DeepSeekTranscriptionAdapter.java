package com.fsieng.assessment.adapter.out.asr;

import com.fsieng.assessment.application.port.out.TranscriptionPort;
import com.fsieng.assessment.domain.AudioClip;
import com.fsieng.assessment.domain.ScoringUnavailableException;
import org.jspecify.annotations.Nullable;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** DeepSeek speech-to-text (POST /v1/tools/asr, multipart field "file"). */
public class DeepSeekTranscriptionAdapter implements TranscriptionPort {

  private final RestClient client;
  private final boolean configured;

  public DeepSeekTranscriptionAdapter(String baseUrl, String apiKey) {
    this(
        RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .build(),
        !apiKey.isBlank());
  }

  DeepSeekTranscriptionAdapter(RestClient client, boolean configured) {
    this.client = client;
    this.configured = configured;
  }

  /** Response body of the speech-to-text endpoint. */
  record AsrResponse(@Nullable String text) {}

  @Override
  public String transcribe(AudioClip recording) {
    if (!configured) {
      throw new ScoringUnavailableException("speech-to-text is not configured (DEEPSEEK_API_KEY)");
    }
    MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
    form.add("file", new NamedBytes(recording.bytes(), recording.filename()));
    try {
      AsrResponse response =
          client
              .post()
              .uri("/v1/tools/asr")
              .contentType(MediaType.MULTIPART_FORM_DATA)
              .body(form)
              .retrieve()
              .body(AsrResponse.class);
      String text = response == null ? null : response.text();
      if (text == null) {
        throw new ScoringUnavailableException("speech-to-text returned no text");
      }
      return text;
    } catch (RestClientException e) {
      throw new ScoringUnavailableException("speech-to-text failed: " + e.getMessage());
    }
  }

  /** A byte array that multipart encoding sends as a file with a name. */
  private static final class NamedBytes extends ByteArrayResource {
    private final String filename;

    NamedBytes(byte[] bytes, String filename) {
      super(bytes);
      this.filename = filename;
    }

    @Override
    public String getFilename() {
      return filename;
    }
  }
}
