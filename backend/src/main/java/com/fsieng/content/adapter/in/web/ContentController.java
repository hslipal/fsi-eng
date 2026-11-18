package com.fsieng.content.adapter.in.web;

import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.application.port.in.SpeakingPromptsUseCase;
import com.fsieng.content.domain.SampleAudio;
import com.fsieng.content.domain.Track;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content")
public class ContentController {

  private final ListPublishedContentUseCase listPublishedContent;
  private final SpeakingPromptsUseCase speakingPrompts;

  public ContentController(
      ListPublishedContentUseCase listPublishedContent, SpeakingPromptsUseCase speakingPrompts) {
    this.listPublishedContent = listPublishedContent;
    this.speakingPrompts = speakingPrompts;
  }

  @GetMapping("/speaking-prompts")
  public List<SpeakingPromptResponse> speakingPrompts() {
    return speakingPrompts.list().stream().map(SpeakingPromptResponse::from).toList();
  }

  @GetMapping("/speaking-prompts/{key}/sample")
  public ResponseEntity<byte[]> sample(@PathVariable("key") String key) {
    SampleAudio audio = speakingPrompts.sample(key);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(audio.contentType()))
        .body(audio.bytes());
  }

  @GetMapping("/items")
  public List<ContentItemResponse> items(@RequestParam("track") String track) {
    return listPublishedContent.listPublished(Track.fromCode(track)).stream()
        .map(ContentItemResponse::from)
        .toList();
  }
}
