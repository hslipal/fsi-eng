package com.fsieng.practice.adapter.out.content;

import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.Track;
import com.fsieng.practice.application.port.out.DrillCatalogPort;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.PracticeItem;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.Nullable;

/**
 * Turns published content into practice items. Only pattern drills are auto-graded; dialogues are
 * for listening and memorising and are not practice cards.
 */
public class ContentCatalogAdapter implements DrillCatalogPort {

  private final ListPublishedContentUseCase publishedContent;

  public ContentCatalogAdapter(ListPublishedContentUseCase publishedContent) {
    this.publishedContent = publishedContent;
  }

  @Override
  public List<PracticeItem> itemsFor(String track) {
    List<PracticeItem> items = new ArrayList<>();
    for (ContentItem content : publishedContent.listPublished(Track.fromCode(track))) {
      items.addAll(itemsOf(content));
    }
    return items;
  }

  @Override
  public Optional<PracticeItem> find(CardKey key) {
    return Arrays.stream(Track.values())
        .flatMap(track -> itemsFor(track.code()).stream())
        .filter(item -> item.key().equals(key))
        .findFirst();
  }

  private static List<PracticeItem> itemsOf(ContentItem content) {
    List<PracticeItem> items = new ArrayList<>();
    for (int d = 0; d < content.drills().size(); d++) {
      Drill drill = content.drills().get(d);
      if (drill instanceof Drill.PatternDrill pattern) {
        addAll(
            items,
            content,
            d,
            pattern.type().code(),
            pattern.instruction(),
            pattern.model(),
            null,
            pattern.items());
      } else if (drill instanceof Drill.Reading reading) {
        addAll(
            items,
            content,
            d,
            "reading",
            reading.instruction(),
            null,
            reading.passage(),
            reading.items());
      }
    }
    return items;
  }

  private static void addAll(
      List<PracticeItem> into,
      ContentItem content,
      int drillIndex,
      String type,
      String instruction,
      @Nullable String model,
      @Nullable String passage,
      List<Drill.Item> drillItems) {
    for (int i = 0; i < drillItems.size(); i++) {
      Drill.Item item = drillItems.get(i);
      into.add(
          new PracticeItem(
              CardKey.of(content.id().value(), drillIndex, i),
              content.title(),
              type,
              instruction,
              model,
              passage,
              item.cue(),
              item.options(),
              item.answers()));
    }
  }
}
