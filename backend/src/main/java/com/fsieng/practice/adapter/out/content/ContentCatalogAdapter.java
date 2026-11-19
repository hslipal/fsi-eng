package com.fsieng.practice.adapter.out.content;

import com.fsieng.content.application.port.in.ListPracticeContentUseCase;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.Track;
import com.fsieng.practice.application.port.out.DrillCatalogPort;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.Lesson;
import com.fsieng.practice.domain.PracticeItem;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.Nullable;

/**
 * Turns practice content (published, plus dev-only in the dev profile) into practice items. Only
 * pattern drills are auto-graded; dialogues are for listening and memorising and are not practice
 * cards.
 */
public class ContentCatalogAdapter implements DrillCatalogPort {

  private final ListPracticeContentUseCase practiceContent;

  public ContentCatalogAdapter(ListPracticeContentUseCase practiceContent) {
    this.practiceContent = practiceContent;
  }

  @Override
  public List<PracticeItem> itemsFor(String track) {
    List<PracticeItem> items = new ArrayList<>();
    for (ContentItem content : practiceContent.listForPractice(Track.fromCode(track))) {
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

  @Override
  public List<Lesson> lessonsFor(String track) {
    return practiceContent.listForPractice(Track.fromCode(track)).stream()
        .map(ContentCatalogAdapter::lessonOf)
        .toList();
  }

  @Override
  public Optional<Lesson> lesson(String id) {
    return Arrays.stream(Track.values())
        .flatMap(track -> practiceContent.listForPractice(track).stream())
        .filter(content -> content.id().value().toString().equals(id))
        .findFirst()
        .map(ContentCatalogAdapter::lessonOf);
  }

  private static Lesson lessonOf(ContentItem content) {
    return new Lesson(
        content.id().value().toString(),
        content.title(),
        content.level(),
        itemsOf(content),
        !content.license().publishable());
  }

  private static List<PracticeItem> itemsOf(ContentItem content) {
    List<PracticeItem> items = new ArrayList<>();
    for (int d = 0; d < content.drills().size(); d++) {
      Drill drill = content.drills().get(d);
      if (drill instanceof Drill.PatternDrill pattern) {
        addPattern(items, content, d, pattern);
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

  private static void addPattern(
      List<PracticeItem> into, ContentItem content, int drillIndex, Drill.PatternDrill pattern) {
    for (int i = 0; i < pattern.items().size(); i++) {
      Drill.Item item = pattern.items().get(i);
      into.add(
          new PracticeItem(
              CardKey.of(content.id().value(), drillIndex, i),
              content.title(),
              pattern.type().code(),
              pattern.instruction(),
              pattern.model(),
              null,
              item.cue(),
              item.options(),
              item.answers(),
              pattern.baseOf(i)));
    }
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
