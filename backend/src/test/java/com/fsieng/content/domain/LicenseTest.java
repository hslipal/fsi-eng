package com.fsieng.content.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class LicenseTest {

  @Test
  void onlyDevOnlyIsNotPublishable() {
    assertThat(new License.PublicDomainUsGov().publishable()).isTrue();
    assertThat(new License.CcBy("Kubernetes Authors").publishable()).isTrue();
    assertThat(new License.Generated("deepseek").publishable()).isTrue();
    assertThat(new License.Licensed("GRANT-1").publishable()).isTrue();
    assertThat(new License.DevOnly().publishable()).isFalse();
  }

  @Test
  void kindsMatchTheContentFileFormat() {
    assertThat(new License.PublicDomainUsGov().kind()).isEqualTo("public-domain-us-gov");
    assertThat(new License.CcBy("a").kind()).isEqualTo("cc-by");
    assertThat(new License.Generated("g").kind()).isEqualTo("generated");
    assertThat(new License.DevOnly().kind()).isEqualTo("dev-only");
    assertThat(new License.Licensed("x").kind()).isEqualTo("licensed");
  }

  @Test
  void licensedMaterialNeedsAGrantId() {
    assertThatThrownBy(() -> new License.Licensed(" "))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("grant id");
  }

  @Test
  void ccByNeedsAnAttribution() {
    assertThatThrownBy(() -> new License.CcBy("")).isInstanceOf(InvalidContentException.class);
  }

  @Test
  void generatedNeedsAGenerator() {
    assertThatThrownBy(() -> new License.Generated("")).isInstanceOf(InvalidContentException.class);
  }

  @Test
  void rebuildsEveryKindFromItsStoredForm() {
    List<License> all =
        List.of(
            new License.PublicDomainUsGov(),
            new License.CcBy("K8s Authors"),
            new License.Generated("deepseek"),
            new License.DevOnly(),
            new License.Licensed("GRANT-7"));
    for (License license : all) {
      assertThat(License.of(license.kind(), License.detailOf(license))).isEqualTo(license);
    }
  }

  @Test
  void rejectsUnknownKindsAndMissingDetails() {
    assertThatThrownBy(() -> License.of("pirated", null))
        .isInstanceOf(InvalidContentException.class);
    assertThatThrownBy(() -> License.of("licensed", null))
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("licensed");
  }
}
