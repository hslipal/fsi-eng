package com.fsieng.practice.adapter.out.content;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.DrillType;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import com.fsieng.practice.domain.CardKey;
import com.fsieng.practice.domain.PracticeItem;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ContentCatalogAdapterTest {

  private static final UUID ID = new UUID(7L, 7L);

  private static final ContentItem STANDUP =
      new ContentItem(
          new ContentItemId(ID),
          Track.IT,
          "Daily stand-up",
          null,
          new License.Generated("claude"),
          "ILR 1+",
          "admin",
          List.of(
              new Drill.Dialogue(List.of(new Drill.Line("Dev", "I'm blocked."))),
              new Drill.PatternDrill(
                  DrillType.SUBSTITUTION,
                  "Replace the task.",
                  "Yesterday I finished the login page.",
                  List.of(
                      new Drill.Item("fixed the bug", List.of("Yesterday I fixed the bug.")),
                      new Drill.Item("reviewed a PR", List.of("Yesterday I reviewed a PR.")))),
              new Drill.Reading(
                  "TRUE, FALSE or NOT GIVEN?",
                  "The stand-up lasts ten minutes.",
                  List.of(
                      new Drill.Item(
                          "The stand-up is long.",
                          List.of("FALSE"),
                          List.of("TRUE", "FALSE", "NOT GIVEN"))))));

  private static final UUID TABLE_ID = new UUID(8L, 8L);

  private static final ContentItem TABLE =
      new ContentItem(
          new ContentItemId(TABLE_ID),
          Track.BUSINESS,
          "Things on the table",
          null,
          new License.Generated("claude"),
          "ILR 1",
          "admin",
          List.of(
              new Drill.PatternDrill(
                  DrillType.EXPANSION,
                  "Change the sentence with the cue.",
                  "There's a cup on the table.",
                  List.of(
                      new Drill.Item("spoon", List.of("There's a spoon on the table.")),
                      new Drill.Item("on the chair", List.of("There's a spoon on the chair."))),
                  true)));

  private final ContentCatalogAdapter adapter =
      new ContentCatalogAdapter(track ->
          switch (track) {
            case IT -> List.of(STANDUP);
            case BUSINESS -> List.of(TABLE);
            case IELTS -> List.of();
          });

  @Test
  void turnsPatternAndReadingItemsIntoCardsAndSkipsDialogues() {
    List<PracticeItem> items = adapter.itemsFor("it");

    assertThat(items).hasSize(3);
    PracticeItem first = items.getFirst();
    assertThat(first.key()).isEqualTo(CardKey.of(ID, 1, 0));
    assertThat(first.type()).isEqualTo("substitution");
    assertThat(first.model()).isEqualTo("Yesterday I finished the login page.");
    assertThat(first.answers()).containsExactly("Yesterday I fixed the bug.");
    assertThat(first.options()).isEmpty();
    PracticeItem reading = items.get(2);
    assertThat(reading.key()).isEqualTo(CardKey.of(ID, 2, 0));
    assertThat(reading.type()).isEqualTo("reading");
    assertThat(reading.passage()).isEqualTo("The stand-up lasts ten minutes.");
    assertThat(reading.options()).containsExactly("TRUE", "FALSE", "NOT GIVEN");
    assertThat(first.base()).isNull();
    assertThat(adapter.itemsFor("ielts")).isEmpty();
  }

  @Test
  void findsACardInAnyTrack() {
    assertThat(adapter.find(CardKey.of(ID, 1, 1)))
        .hasValueSatisfying(item -> assertThat(item.cue()).isEqualTo("reviewed a PR"));
    assertThat(adapter.find(CardKey.of(ID, 0, 0))).isEmpty();
  }

  @Test
  void chainedItemsBuildOnTheModelAndThenOnThePreviousAnswer() {
    List<PracticeItem> items = adapter.itemsFor("business");

    assertThat(items)
        .extracting(PracticeItem::base)
        .containsExactly("There's a cup on the table.", "There's a spoon on the table.");
  }

  @Test
  void everyPublishedItemIsALesson() {
    assertThat(adapter.lessonsFor("it"))
        .singleElement()
        .satisfies(lesson -> {
          assertThat(lesson.id()).isEqualTo(ID.toString());
          assertThat(lesson.title()).isEqualTo("Daily stand-up");
          assertThat(lesson.level()).isEqualTo("ILR 1+");
          assertThat(lesson.items()).extracting(PracticeItem::type).containsOnly("substitution");
        });
    assertThat(adapter.lesson(TABLE_ID.toString()))
        .hasValueSatisfying(lesson -> assertThat(lesson.count("expansion")).isEqualTo(2));
    assertThat(adapter.lesson("missing")).isEmpty();
  }
}
