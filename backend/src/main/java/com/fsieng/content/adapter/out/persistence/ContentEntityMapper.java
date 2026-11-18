package com.fsieng.content.adapter.out.persistence;

import com.fsieng.content.adapter.out.json.DrillJsonCodec;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;

/** Converts rows to domain objects and back; every row is re-validated by the domain. */
final class ContentEntityMapper {

  private final DrillJsonCodec drills;

  ContentEntityMapper(DrillJsonCodec drills) {
    this.drills = drills;
  }

  ContentItem toDomain(ContentItemEntity entity) {
    return new ContentItem(
        new ContentItemId(entity.getId()),
        Track.fromCode(entity.getTrack()),
        entity.getTitle(),
        entity.getSourceUrl(),
        License.of(entity.getLicenseKind(), entity.getLicenseDetail()),
        entity.getLevel(),
        entity.getReviewedBy(),
        drills.decode(entity.getDrillsJson()));
  }

  ContentItemEntity toEntity(ContentItem item) {
    return new ContentItemEntity(item.id().value(), item.track().code(), item.title(), item.level())
        .withSource(item.sourceUrl())
        .withLicense(item.license().kind(), License.detailOf(item.license()))
        .reviewedBy(item.reviewedBy())
        .withDrills(drills.encode(item.drills()));
  }
}
