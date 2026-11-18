package com.fsieng.content.adapter.out.files;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fsieng.content.adapter.out.json.DrillJson;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** JSON shape of one file under content/ (see content/README.md). */
record ContentFileJson(
    @Nullable String id,
    @Nullable String track,
    @Nullable String title,
    @Nullable String level,
    @Nullable SourceJson source,
    @Nullable LicenseJson license,
    @JsonProperty("reviewed_by") @Nullable String reviewedBy,
    @Nullable List<DrillJson> drills) {

  record SourceJson(@Nullable String url, @Nullable String generator) {}

  record LicenseJson(
      @Nullable String kind, @Nullable String attribution, @Nullable String grantId) {}
}
