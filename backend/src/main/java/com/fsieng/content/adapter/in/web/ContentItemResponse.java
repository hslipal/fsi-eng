package com.fsieng.content.adapter.in.web;

import com.fsieng.content.domain.ContentItem;
import org.jspecify.annotations.Nullable;

/** JSON shape of a published item. Mirrors frontend ContentItemSchema; see docs/api-contract.md. */
public record ContentItemResponse(
    String id,
    String track,
    String title,
    @Nullable String sourceUrl,
    String license,
    String level) {

  static ContentItemResponse from(ContentItem item) {
    return new ContentItemResponse(
        item.id().value().toString(),
        item.track().code(),
        item.title(),
        item.sourceUrl(),
        item.license().kind(),
        item.level());
  }
}
