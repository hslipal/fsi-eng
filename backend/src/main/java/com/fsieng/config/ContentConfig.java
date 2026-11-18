package com.fsieng.config;

import com.fsieng.content.adapter.out.persistence.ContentItemJpaRepository;
import com.fsieng.content.adapter.out.persistence.ContentPersistenceAdapter;
import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.application.service.ContentService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ContentConfig {

  @Bean
  LoadContentPort loadContentPort(ContentItemJpaRepository repository) {
    return new ContentPersistenceAdapter(repository);
  }

  @Bean
  ListPublishedContentUseCase listPublishedContentUseCase(LoadContentPort loadContentPort) {
    return new ContentService(loadContentPort);
  }
}
