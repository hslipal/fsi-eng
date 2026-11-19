package com.fsieng.content.adapter.out.json;

import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.DrillType;
import com.fsieng.content.domain.InvalidContentException;
import java.util.List;
import java.util.Objects;
import org.jspecify.annotations.Nullable;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Converts drills between the domain model and their JSON form. */
public final class DrillJsonCodec {

  private static final String DIALOGUE = "dialogue";
  private static final String READING = "reading";
  private static final String SPEAKING = "speaking";

  private final JsonMapper mapper;

  public DrillJsonCodec(JsonMapper mapper) {
    this.mapper = mapper;
  }

  public List<Drill> decode(String json) {
    return fromJson(mapper.readValue(json, new TypeReference<List<DrillJson>>() {}));
  }

  public String encode(List<Drill> drills) {
    return mapper.writeValueAsString(drills.stream().map(DrillJsonCodec::toJson).toList());
  }

  public static List<Drill> fromJson(@Nullable List<DrillJson> drills) {
    if (drills == null) {
      return List.of();
    }
    return drills.stream().map(DrillJsonCodec::toDomain).toList();
  }

  static Drill toDomain(DrillJson json) {
    String type = required(json.type(), "drill type");
    if (DIALOGUE.equals(type)) {
      List<Drill.Line> lines =
          required(json.lines(), "dialogue lines").stream().map(DrillJsonCodec::toLine).toList();
      return new Drill.Dialogue(lines);
    }
    if (SPEAKING.equals(type)) {
      List<Drill.SpeakingPrompt> prompts =
          required(json.items(), "speaking questions").stream()
              .map(DrillJsonCodec::toPrompt)
              .toList();
      return new Drill.Speaking(required(json.instruction(), "speaking instruction"), prompts);
    }
    List<Drill.Item> items =
        required(json.items(), "drill items").stream().map(DrillJsonCodec::toItem).toList();
    if (READING.equals(type)) {
      return new Drill.Reading(
          required(json.instruction(), "reading instruction"),
          required(json.passage(), "reading passage"),
          items);
    }
    return new Drill.PatternDrill(
        DrillType.fromCode(type),
        required(json.instruction(), "drill instruction"),
        json.model(),
        items,
        Boolean.TRUE.equals(json.chained()),
        json.modelTranslation());
  }

  private static Drill.Line toLine(DrillJson.LineJson line) {
    return new Drill.Line(
        required(line.speaker(), "dialogue speaker"), required(line.text(), "dialogue text"));
  }

  private static Drill.SpeakingPrompt toPrompt(DrillJson.ItemJson item) {
    return new Drill.SpeakingPrompt(
        required(item.cue(), "speaking question"),
        required(item.part(), "speaking part"),
        item.audio(),
        item.seconds());
  }

  private static Drill.Item toItem(DrillJson.ItemJson item) {
    List<String> options = Objects.requireNonNullElse(item.options(), List.of());
    return new Drill.Item(
        required(item.cue(), "drill cue"),
        required(item.answers(), "drill answers"),
        options,
        item.translation(),
        item.cueTranslation());
  }

  static DrillJson toJson(Drill drill) {
    return switch (drill) {
      case Drill.Dialogue dialogue ->
          new DrillJson(
              DIALOGUE,
              null,
              null,
              null,
              null,
              dialogue.lines().stream().map(DrillJsonCodec::toJson).toList());
      case Drill.PatternDrill pattern ->
          new DrillJson(
              pattern.type().code(),
              pattern.instruction(),
              pattern.model(),
              null,
              pattern.items().stream().map(DrillJsonCodec::toJson).toList(),
              null,
              pattern.chained() ? Boolean.TRUE : null,
              pattern.modelTranslation());
      case Drill.Speaking speaking ->
          new DrillJson(
              SPEAKING,
              speaking.instruction(),
              null,
              null,
              speaking.prompts().stream().map(DrillJsonCodec::toJson).toList(),
              null);
      case Drill.Reading reading ->
          new DrillJson(
              READING,
              reading.instruction(),
              null,
              reading.passage(),
              reading.items().stream().map(DrillJsonCodec::toJson).toList(),
              null);
    };
  }

  private static DrillJson.LineJson toJson(Drill.Line line) {
    return new DrillJson.LineJson(line.speaker(), line.text());
  }

  private static DrillJson.ItemJson toJson(Drill.SpeakingPrompt prompt) {
    return new DrillJson.ItemJson(
        prompt.question(), null, null, prompt.part(), prompt.audio(), prompt.seconds());
  }

  private static DrillJson.ItemJson toJson(Drill.Item item) {
    return new DrillJson.ItemJson(
        item.cue(),
        item.answers(),
        item.options(),
        null,
        null,
        null,
        item.translation(),
        item.cueTranslation());
  }

  private static <T> T required(@Nullable T value, String what) {
    if (value == null) {
      throw new InvalidContentException(what + " is missing");
    }
    return value;
  }
}
