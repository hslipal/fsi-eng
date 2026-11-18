package com.fsieng.content.adapter.out.files;

import com.fsieng.content.adapter.out.json.DrillJsonCodec;
import com.fsieng.content.application.port.out.ReadContentFilesPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.InvalidContentException;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;
import org.jspecify.annotations.Nullable;
import tools.jackson.databind.json.JsonMapper;

/** Reads content/<track>/*.json. Files under content/_drafts/ wait for review and are skipped. */
public class ContentFileSource implements ReadContentFilesPort {

  private static final String DRAFTS = "_drafts";

  private final Path root;
  private final JsonMapper mapper;

  public ContentFileSource(Path root, JsonMapper mapper) {
    this.root = root;
    this.mapper = mapper;
  }

  @Override
  public List<ContentItem> readAll() {
    if (!Files.isDirectory(root)) {
      return List.of();
    }
    try (Stream<Path> paths = Files.walk(root)) {
      return paths
          .filter(Files::isRegularFile)
          .filter(path -> path.getFileName().toString().endsWith(".json"))
          .filter(path -> !root.relativize(path).startsWith(DRAFTS))
          .sorted()
          .map(this::read)
          .toList();
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  private ContentItem read(Path path) {
    try {
      String json = Files.readString(path, StandardCharsets.UTF_8);
      return toDomain(mapper.readValue(json, ContentFileJson.class));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    } catch (InvalidContentException e) {
      String reason = Objects.requireNonNullElse(e.getMessage(), "invalid content");
      throw new InvalidContentException(root.relativize(path) + ": " + reason);
    }
  }

  private static ContentItem toDomain(ContentFileJson file) {
    ContentFileJson.SourceJson source =
        Objects.requireNonNullElse(file.source(), new ContentFileJson.SourceJson(null, null));
    ContentFileJson.LicenseJson license = required(file.license(), "license");
    String kind = required(license.kind(), "license.kind");
    return new ContentItem(
        new ContentItemId(UUID.fromString(required(file.id(), "id"))),
        Track.fromCode(required(file.track(), "track")),
        required(file.title(), "title"),
        source.url(),
        License.of(kind, licenseDetail(kind, license, source)),
        required(file.level(), "level"),
        file.reviewedBy(),
        DrillJsonCodec.fromJson(file.drills()));
  }

  private static @Nullable String licenseDetail(
      String kind, ContentFileJson.LicenseJson license, ContentFileJson.SourceJson source) {
    return switch (kind) {
      case "cc-by" -> license.attribution();
      case "licensed" -> license.grantId();
      case "generated" -> source.generator();
      default -> null;
    };
  }

  private static <T> T required(@Nullable T value, String field) {
    if (value == null) {
      throw new InvalidContentException(field + " is missing");
    }
    return value;
  }
}
