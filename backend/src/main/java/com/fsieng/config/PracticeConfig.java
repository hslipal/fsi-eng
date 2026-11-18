package com.fsieng.config;

import com.fsieng.content.application.port.in.ListPublishedContentUseCase;
import com.fsieng.practice.adapter.out.content.ContentCatalogAdapter;
import com.fsieng.practice.adapter.out.persistence.ReviewCardJpaRepository;
import com.fsieng.practice.adapter.out.persistence.ReviewCardPersistenceAdapter;
import com.fsieng.practice.application.service.PracticeService;
import com.fsieng.practice.domain.AnswerGrader;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PracticeConfig {

  @Bean
  PracticeService practiceService(
      ListPublishedContentUseCase publishedContent,
      ReviewCardJpaRepository reviewCards,
      Clock clock) {
    return new PracticeService(
        new ContentCatalogAdapter(publishedContent),
        new ReviewCardPersistenceAdapter(reviewCards),
        new AnswerGrader(),
        clock);
  }
}
