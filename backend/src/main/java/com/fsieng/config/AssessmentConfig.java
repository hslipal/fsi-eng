package com.fsieng.config;

import com.fsieng.assessment.adapter.out.asr.DeepSeekTranscriptionAdapter;
import com.fsieng.assessment.adapter.out.llm.DeepSeekScoringAdapter;
import com.fsieng.assessment.application.service.AssessmentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** DeepSeek settings. Without DEEPSEEK_API_KEY the assessment endpoints answer 503. */
@Configuration
public class AssessmentConfig {

  @Bean
  AssessmentService assessmentService(
      @Value("${fsi.deepseek.base-url:https://api.deepseek.com}") String baseUrl,
      @Value("${fsi.deepseek.api-key:}") String apiKey,
      @Value("${fsi.deepseek.model:deepseek-chat}") String model) {
    return new AssessmentService(
        new DeepSeekScoringAdapter(baseUrl, apiKey, model),
        new DeepSeekTranscriptionAdapter(baseUrl, apiKey));
  }
}
