package com.fsieng.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The only source of "now". Inject {@link Clock}; never call Instant.now() directly. */
@Configuration
public class ClockConfig {

  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
