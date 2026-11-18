package com.fsieng.architecture;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.fsieng.common.domain.DomainException;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.GeneralCodingRules;
import jakarta.persistence.Entity;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import org.springframework.web.bind.annotation.RestController;

/**
 * GUARDRAIL: executable architecture. Every module (content, course, practice, assessment, learner)
 * follows the same hexagonal layout; these rules scan all of them.
 */
@AnalyzeClasses(packages = "com.fsieng", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

  private static final String DOMAIN = "..domain..";
  private static final String APPLICATION = "..application..";
  private static final String WEB = "..adapter.in.web..";
  private static final String OUTBOUND = "..adapter.out..";
  private static final String PERSISTENCE = "..adapter.out.persistence..";
  private static final String LLM = "..adapter.out.llm..";
  private static final String ASR = "..adapter.out.asr..";
  private static final String CONFIG = "com.fsieng.config..";

  // ── 1. Hexagonal layering ────────────────────────────────────────────────────────────
  @ArchTest
  static final ArchRule hexagonal_layers =
      layeredArchitecture()
          .consideringOnlyDependenciesInLayers()
          .layer("Domain")
          .definedBy(DOMAIN)
          .layer("Application")
          .definedBy(APPLICATION)
          .layer("Web")
          .definedBy(WEB)
          .layer("Outbound")
          .definedBy(OUTBOUND)
          .layer("Config")
          .definedBy(CONFIG)
          .whereLayer("Web")
          .mayNotBeAccessedByAnyLayer()
          .whereLayer("Outbound")
          .mayOnlyBeAccessedByLayers("Config")
          .whereLayer("Application")
          .mayOnlyBeAccessedByLayers("Web", "Outbound", "Config")
          .whereLayer("Domain")
          .mayOnlyBeAccessedByLayers("Application", "Web", "Outbound", "Config");

  // ── 2. The core is framework-free ───────────────────────────────────────────────────
  @ArchTest
  static final ArchRule core_is_framework_free =
      noClasses()
          .that()
          .resideInAnyPackage(DOMAIN, APPLICATION)
          .should()
          .dependOnClassesThat()
          .resideInAnyPackage("org.springframework..", "jakarta..", "com.fasterxml..", "tools..")
          .because("[core_is_framework_free] domain and application must run without a framework");

  // ── 3. Web talks to input ports only ────────────────────────────────────────────────
  @ArchTest
  static final ArchRule web_uses_input_ports_only =
      noClasses()
          .that()
          .resideInAPackage(WEB)
          .should()
          .dependOnClassesThat()
          .resideInAnyPackage("..application.service..", "..application.port.out..")
          .because("[web_uses_input_ports_only] controllers depend on use-case interfaces");

  // ── 4. Placement & naming conventions ───────────────────────────────────────────────
  @ArchTest
  static final ArchRule controllers_live_in_web_adapter =
      classes()
          .that()
          .areAnnotatedWith(RestController.class)
          .should()
          .resideInAPackage(WEB)
          .andShould()
          .haveSimpleNameEndingWith("Controller");

  @ArchTest
  static final ArchRule persistence_adapters_implement_ports =
      classes()
          .that()
          .resideInAPackage(PERSISTENCE)
          .and()
          .haveSimpleNameEndingWith("Adapter")
          .should()
          .implement(resideInAPackage("..application.port.out.."))
          .because("[persistence_adapters_implement_ports] the core only knows port.out");

  @ArchTest
  static final ArchRule ports_are_interfaces =
      classes()
          .that()
          .resideInAnyPackage("..port.in..", "..port.out..")
          .and()
          .haveSimpleNameNotEndingWith("Exception")
          .should()
          .beInterfaces();

  // ── 5. FSI-Eng: models, speech and network only behind their adapters ───────────────
  @ArchTest
  static final ArchRule llm_only_in_llm_adapter =
      noClasses()
          .that()
          .resideOutsideOfPackages(LLM, ASR)
          .should()
          .dependOnClassesThat()
          .resideInAnyPackage(
              "java.net.http..",
              "org.springframework.web.client..",
              "org.springframework.ai..",
              "com.openai..",
              "com.anthropic..",
              "dev.langchain4j..")
          .because(
              "[llm_only_in_llm_adapter] DeepSeek is called only from adapter.out.llm and"
                  + " adapter.out.asr; use ScoringPort / GenerationPort / TranscriptionPort");

  // ── 6. FSI-Eng: JPA stays in the persistence adapter ────────────────────────────────
  @ArchTest
  static final ArchRule entities_only_in_persistence =
      noClasses()
          .that()
          .resideOutsideOfPackage(PERSISTENCE)
          .should()
          .beAnnotatedWith(Entity.class)
          .because(
              "[entities_only_in_persistence] @Entity classes live in adapter.out.persistence"
                  + " and are mapped to domain records");

  // ── 7. No cycles ────────────────────────────────────────────────────────────────────
  @ArchTest
  static final ArchRule no_cycles_between_modules =
      slices().matching("com.fsieng.(*)..").should().beFreeOfCycles();

  @ArchTest
  static final ArchRule no_cycles_within_modules =
      slices().matching("com.fsieng.(*).(**)").should().beFreeOfCycles();

  // ── 8. Time must be injectable (Clock), never read from the system directly ─────────
  @ArchTest
  static final ArchRule no_system_time =
      noClasses()
          .should()
          .callMethod(Instant.class, "now")
          .orShould()
          .callMethod(LocalDateTime.class, "now")
          .orShould()
          .callMethod(LocalDate.class, "now")
          .orShould()
          .callMethod(ZonedDateTime.class, "now")
          .orShould()
          .callMethod(System.class, "currentTimeMillis")
          .because("[no_system_time] use an injected java.time.Clock so behaviour is testable");

  // ── 9. General coding rules (common AI mistakes) ────────────────────────────────────
  @ArchTest
  static final ArchRule no_field_injection =
      GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;

  @ArchTest
  static final ArchRule no_std_streams =
      GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS;

  @ArchTest
  static final ArchRule no_generic_exceptions =
      GeneralCodingRules.NO_CLASSES_SHOULD_THROW_GENERIC_EXCEPTIONS;

  @ArchTest
  static final ArchRule no_jul = GeneralCodingRules.NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING;

  @ArchTest
  static final ArchRule no_mutable_public_fields =
      fields()
          .that()
          .arePublic()
          .and()
          .areDeclaredInClassesThat()
          .resideInAPackage("com.fsieng..")
          .should()
          .beFinal()
          .andShould()
          .beStatic();

  @ArchTest
  static final ArchRule domain_exceptions_extend_base =
      classes()
          .that()
          .resideInAPackage(DOMAIN)
          .and()
          .areAssignableTo(RuntimeException.class)
          .and()
          .doNotHaveSimpleName("DomainException")
          .should()
          .beAssignableTo(DomainException.class);
}
