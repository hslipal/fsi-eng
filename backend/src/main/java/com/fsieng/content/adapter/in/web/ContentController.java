package com.fsieng.content.adapter.in.web;

import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.domain.Track;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content")
public class ContentController {

  private final ListPublishedContentUseCase listPublishedContent;

  public ContentController(ListPublishedContentUseCase listPublishedContent) {
    this.listPublishedContent = listPublishedContent;
  }

  @GetMapping("/items")
  public List<ContentItemResponse> items(@RequestParam("track") String track) {
    return listPublishedContent.listPublished(Track.fromCode(track)).stream()
        .map(ContentItemResponse::from)
        .toList();
  }
}
