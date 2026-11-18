package com.fsieng.content.adapter.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fsieng.content.domain.InvalidContentException;
import com.fsieng.content.domain.License;
import org.junit.jupiter.api.Test;

class ContentEntityMapperTest {

  @Test
  void mapsEveryLicenseKind() {
    assertThat(ContentEntityMapper.license("public-domain-us-gov", null))
        .isEqualTo(new License.PublicDomainUsGov());
    assertThat(ContentEntityMapper.license("cc-by", "K8s Authors"))
        .isEqualTo(new License.CcBy("K8s Authors"));
    assertThat(ContentEntityMapper.license("generated", "deepseek"))
        .isEqualTo(new License.Generated("deepseek"));
    assertThat(ContentEntityMapper.license("dev-only", null)).isEqualTo(new License.DevOnly());
    assertThat(ContentEntityMapper.license("licensed", "GRANT-7"))
        .isEqualTo(new License.Licensed("GRANT-7"));
  }

  @Test
  void rejectsUnknownKindsAndMissingDetails() {
    assertThatThrownBy(() -> ContentEntityMapper.license("pirated", null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> ContentEntityMapper.license("licensed", null))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("licensed");
  }
}
