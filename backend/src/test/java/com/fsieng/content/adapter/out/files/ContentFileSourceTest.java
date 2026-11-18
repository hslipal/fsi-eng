package com.fsieng.content.adapter.out.files;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.InvalidContentException;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.Track;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

class ContentFileSourceTest {

  private static final JsonMapper JSON =
      JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();

  @TempDir Path root;

  private void write(String relative, String json) throws IOException {
    Path file = root.resolve(relative);
    Files.createDirectories(file.getParent());
    Files.writeString(file, json, StandardCharsets.UTF_8);
  }

  private static String item(String id, String license, String extra) {
    return """
    {"id": "%s", "track": "it", "title": "Daily stand-up", "level": "ILR 2",
     "source": {"url": "https://kubernetes.io/docs/", "generator": "claude"},
     "license": %s, %s
     "drills": [{"type": "dialogue", "lines": [{"speaker": "A", "text": "I'm blocked."}]}]}
    """
        .formatted(id, license, extra);
  }

  @Test
  void readsReviewedFilesAndSkipsDraftsAndOtherFiles() throws IOException {
    write(
        "it/standup.json",
        item(
            "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
            "{\"kind\": \"generated\"}",
            "\"reviewed_by\": \"admin\", \"note\": \"ignored\","));
    write(
        "_drafts/it/draft.json",
        item("4f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90", "{\"kind\": \"generated\"}", ""));
    write("README.md", "# not content");

    List<ContentItem> items = new ContentFileSource(root, JSON).readAll();

    assertThat(items).hasSize(1);
    ContentItem standup = items.getFirst();
    assertThat(standup.track()).isEqualTo(Track.IT);
    assertThat(standup.license()).isEqualTo(new License.Generated("claude"));
    assertThat(standup.isPublishable()).isTrue();
    assertThat(standup.drills()).hasSize(1);
  }

  @Test
  void takesLicenseDetailsFromTheLicenseBlock() throws IOException {
    write(
        "it/a.json",
        item(
            "5f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
            "{\"kind\": \"cc-by\", \"attribution\": \"The Kubernetes Authors\"}",
            ""));
    write(
        "it/b.json",
        item(
            "6f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
            "{\"kind\": \"licensed\", \"grantId\": \"GRANT-1\"}",
            ""));
    write(
        "it/c.json",
        item("7f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90", "{\"kind\": \"public-domain-us-gov\"}", ""));

    List<License> licenses =
        new ContentFileSource(root, JSON).readAll().stream().map(ContentItem::license).toList();

    assertThat(licenses)
        .containsExactly(
            new License.CcBy("The Kubernetes Authors"),
            new License.Licensed("GRANT-1"),
            new License.PublicDomainUsGov());
  }

  @Test
  void namesTheFileWhenItIsInvalid() throws IOException {
    write("business/broken.json", "{\"id\": \"8f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90\"}");

    assertThatThrownBy(() -> new ContentFileSource(root, JSON).readAll())
        .isInstanceOf(InvalidContentException.class)
        .hasMessageContaining("broken.json")
        .hasMessageContaining("license");
  }

  @Test
  void aMissingFolderMeansNoContent() {
    assertThat(new ContentFileSource(root.resolve("absent"), JSON).readAll()).isEmpty();
  }
}
