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
    @Nullable List<ItemJson> items,
    @Nullable List<LineJson> lines) {

  /** One cue with its accepted answers. */
  public record ItemJson(@Nullable String cue, @Nullable List<String> answers) {}

  /** One dialogue line. */
  public record LineJson(@Nullable String speaker, @Nullable String text) {}
}
