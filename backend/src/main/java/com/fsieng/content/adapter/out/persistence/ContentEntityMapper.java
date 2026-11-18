package com.fsieng.content.adapter.out.persistence;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.InvalidContentException;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import org.jspecify.annotations.Nullable;

/** Converts rows to domain objects; every row is re-validated by the domain constructors. */
final class ContentEntityMapper {

  private ContentEntityMapper() {}

  static ContentItem toDomain(ContentItemEntity entity) {
    return new ContentItem(
        new ContentItemId(entity.getId()),
        Track.fromCode(entity.getTrack()),
        entity.getTitle(),
        entity.getSourceUrl(),
        license(entity.getLicenseKind(), entity.getLicenseDetail()),
        entity.getLevel(),
        entity.getReviewedBy());
  }

  static License license(String kind, @Nullable String detail) {
    return switch (kind) {
      case "public-domain-us-gov" -> new License.PublicDomainUsGov();
      case "cc-by" -> new License.CcBy(requireDetail(kind, detail));
      case "generated" -> new License.Generated(requireDetail(kind, detail));
      case "dev-only" -> new License.DevOnly();
      case "licensed" -> new License.Licensed(requireDetail(kind, detail));
      default -> throw new InvalidContentException("unknown license kind: " + kind);
    };
  }

  private static String requireDetail(String kind, @Nullable String detail) {
    if (detail == null) {
      throw new InvalidContentException("license " + kind + " needs a detail value");
    }
    return detail;
  }
}
