package com.fsieng.content.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** JPA row for a content item. Never leaves this package: the adapter maps it to the domain. */
@Entity
@Table(name = "content_item")
public class ContentItemEntity {

  @Id private UUID id = new UUID(0L, 0L);

  @Column(nullable = false)
  private String track = "";

  @Column(nullable = false)
  private String title = "";

  private @Nullable String sourceUrl;

  @Column(nullable = false)
  private String licenseKind = "";

  private @Nullable String licenseDetail;

  @Column(nullable = false)
  private String level = "";

  private @Nullable String reviewedBy;

  protected ContentItemEntity() {}

  public ContentItemEntity(UUID id, String track, String title, String level) {
    this.id = id;
    this.track = track;
    this.title = title;
    this.level = level;
  }

  public ContentItemEntity withSource(@Nullable String url) {
    this.sourceUrl = url;
    return this;
  }

  public ContentItemEntity withLicense(String kind, @Nullable String detail) {
    this.licenseKind = kind;
    this.licenseDetail = detail;
    return this;
  }

  public ContentItemEntity reviewedBy(@Nullable String reviewer) {
    this.reviewedBy = reviewer;
    return this;
  }

  public UUID getId() {
    return id;
  }

  public String getTrack() {
    return track;
  }

  public String getTitle() {
    return title;
  }

  public @Nullable String getSourceUrl() {
    return sourceUrl;
  }

  public String getLicenseKind() {
    return licenseKind;
  }

  public @Nullable String getLicenseDetail() {
    return licenseDetail;
  }

  public String getLevel() {
    return level;
  }

  public @Nullable String getReviewedBy() {
    return reviewedBy;
  }
}
