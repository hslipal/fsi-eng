package com.fsieng.content.adapter.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.fsieng.content.adapter.out.json.DrillJsonCodec;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentItemId;
import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.DrillType;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class ContentEntityMapperTest {

  private final ContentEntityMapper mapper =
      new ContentEntityMapper(new DrillJsonCodec(JsonMapper.builder().build()));

  @Test
  void roundTripsAnItemWithDrills() {
    ContentItem item =
        new ContentItem(
            new ContentItemId(UUID.randomUUID()),
            Track.IT,
            "Explaining a failing build",
            "https://kubernetes.io/docs/",
            new License.CcBy("The Kubernetes Authors"),
            "ILR 2",
            "admin",
            List.of(
                new Drill.PatternDrill(
                    DrillType.SUBSTITUTION,
                    "Replace the cause.",
                    "The build fails because the test times out.",
                    List.of(
                        new Drill.Item(
                            "a dependency is missing",
                            List.of("The build fails because a dependency is missing."))))));

    ContentItem back = mapper.toDomain(mapper.toEntity(item));

    assertThat(back).isEqualTo(item);
  }

  @Test
  void anItemWithoutDetailsRoundTrips() {
    ContentItem item =
        new ContentItem(
            new ContentItemId(UUID.randomUUID()),
            Track.BUSINESS,
            "VOA business story",
            null,
            new License.PublicDomainUsGov(),
            "ILR 2",
            null,
            List.of());

    assertThat(mapper.toDomain(mapper.toEntity(item))).isEqualTo(item);
  }
}
