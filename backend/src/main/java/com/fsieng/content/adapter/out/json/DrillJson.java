package com.fsieng.content.adapter.out.json;

import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * JSON shape of one drill, shared by content files and the database column. Every field is nullable
 * here because JSON can omit it; {@link DrillJsonCodec} enforces what each type needs.
 */
public record DrillJson(
    @Nullable String type,
    @Nullable String instruction,
    @Nullable String model,
    @Nullable String passage,
    @Nullable List<ItemJson> items,
    @Nullable List<LineJson> lines,
    @Nullable Boolean chained,
    @Nullable String modelTranslation) {

  /** A drill without a translation of its model sentence. */
  public DrillJson(
      @Nullable String type,
      @Nullable String instruction,
      @Nullable String model,
      @Nullable String passage,
      @Nullable List<ItemJson> items,
      @Nullable List<LineJson> lines,
      @Nullable Boolean chained) {
    this(type, instruction, model, passage, items, lines, chained, null);
  }

  /** A drill that is not chained. */
  public DrillJson(
      @Nullable String type,
      @Nullable String instruction,
      @Nullable String model,
      @Nullable String passage,
      @Nullable List<ItemJson> items,
      @Nullable List<LineJson> lines) {
    this(type, instruction, model, passage, items, lines, null);
  }

  /**
   * One question. Typed and choice items use cue/answers/options; speaking prompts use
   * cue/part/audio/seconds.
   */
  public record ItemJson(
      @Nullable String cue,
      @Nullable List<String> answers,
      @Nullable List<String> options,
      @Nullable Integer part,
      @Nullable String audio,
      @Nullable Double seconds,
      @Nullable String translation,
      @Nullable String cueTranslation) {

    public ItemJson(
        @Nullable String cue,
        @Nullable List<String> answers,
        @Nullable List<String> options,
        @Nullable Integer part,
        @Nullable String audio,
        @Nullable Double seconds) {
      this(cue, answers, options, part, audio, seconds, null, null);
    }

    public ItemJson(
        @Nullable String cue, @Nullable List<String> answers, @Nullable List<String> options) {
      this(cue, answers, options, null, null, null);
    }
  }

  /** One dialogue line. */
  public record LineJson(@Nullable String speaker, @Nullable String text) {}
}
