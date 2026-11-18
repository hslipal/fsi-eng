package com.fsieng.config;

import com.fsieng.content.adapter.out.files.ContentFileSource;
import com.fsieng.content.adapter.out.json.DrillJsonCodec;
import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import com.fsieng.content.adapter.out.persistence.ContentPersistenceAdapter;
import com.fsieng.content.application.port.in.ImportContentUseCase;
import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.application.port.out.ReadContentFilesPort;
import com.fsieng.content.application.port.out.SaveContentPort;
import com.fsieng.content.application.service.ContentImportService;
import com.fsieng.content.application.service.ContentService;
import com.fsieng.content.domain.ContentImportReport;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class ContentConfig {

  private static final Logger LOG = LoggerFactory.getLogger(ContentConfig.class);

  /** Content JSON is validated by scripts/content-check.mjs; ignore fields we do not model yet. */
  private static final JsonMapper CONTENT_JSON =
      JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();

  @Bean
  DrillJsonCodec drillJsonCodec() {
    return new DrillJsonCodec(CONTENT_JSON);
  }

  @Bean
  ContentPersistenceAdapter contentPersistenceAdapter(
      ContentItemJpaRepository repository, DrillJsonCodec drillJsonCodec) {
    return new ContentPersistenceAdapter(repository, drillJsonCodec);
  }

  @Bean
  ReadContentFilesPort readContentFilesPort(
      @Value("${fsi.content.dir:../content}") String contentDir) {
    return new ContentFileSource(Path.of(contentDir), CONTENT_JSON);
  }

  @Bean
  ListPublishedContentUseCase listPublishedContentUseCase(LoadContentPort loadContentPort) {
    return new ContentService(loadContentPort);
  }

  @Bean
  ImportContentUseCase importContentUseCase(
      ReadContentFilesPort readContentFilesPort, SaveContentPort saveContentPort) {
    return new ContentImportService(readContentFilesPort, saveContentPort);
  }

  /** With fsi.content.import-on-startup=true (profile "postgres"), content/ is loaded at boot. */
  @Bean
  ApplicationRunner contentImportOnStartup(
      ImportContentUseCase importContent,
      @Value("${fsi.content.import-on-startup:false}") boolean enabled) {
    return _ -> {
      if (enabled) {
        ContentImportReport report = importContent.importAll();
        LOG.info("Imported {} content items ({} published)", report.imported(), report.published());
      }
    };
  }
}
