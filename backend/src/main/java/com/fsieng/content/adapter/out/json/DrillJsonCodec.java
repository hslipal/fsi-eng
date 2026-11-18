package com.fsieng.content.adapter.out.json;

import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.DrillType;
import com.fsieng.content.domain.InvalidContentException;
import java.util.List;
import org.jspecify.annotations.Nullable;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Converts drills between the domain model and their JSON form. */
public final class DrillJsonCodec {

  private static final String DIALOGUE = "dialogue";

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
    List<Drill.Item> items =
        required(json.items(), "drill items").stream().map(DrillJsonCodec::toItem).toList();
    return new Drill.PatternDrill(
        DrillType.fromCode(type),
        required(json.instruction(), "drill instruction"),
        json.model(),
        items);
  }

  private static Drill.Line toLine(DrillJson.LineJson line) {
    return new Drill.Line(
        required(line.speaker(), "dialogue speaker"), required(line.text(), "dialogue text"));
  }

  private static Drill.Item toItem(DrillJson.ItemJson item) {
    return new Drill.Item(
        required(item.cue(), "drill cue"), required(item.answers(), "drill answers"));
  }

  static DrillJson toJson(Drill drill) {
    return switch (drill) {
      case Drill.Dialogue dialogue ->
          new DrillJson(
              DIALOGUE,
              null,
              null,
              null,
              dialogue.lines().stream()
                  .map(line -> new DrillJson.LineJson(line.speaker(), line.text()))
                  .toList());
      case Drill.PatternDrill pattern ->
          new DrillJson(
              pattern.type().code(),
              pattern.instruction(),
              pattern.model(),
              pattern.items().stream()
                  .map(item -> new DrillJson.ItemJson(item.cue(), item.answers()))
                  .toList(),
              null);
    };
  }

  private static <T> T required(@Nullable T value, String what) {
    if (value == null) {
      throw new InvalidContentException(what + " is missing");
    }
    return value;
  }
}
