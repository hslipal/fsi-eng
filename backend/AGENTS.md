# Backend agent notes

Stack: Java 25 · Spring Boot 4.1 · Maven · Error Prone + NullAway (JSpecify) · ArchUnit · JUnit 5 · AssertJ · JaCoCo · Spotless (google-java-format).

```bash
../scripts/mvn.sh -B spotless:apply   # format first — CI runs spotless:check
../scripts/mvn.sh -B verify           # enforcer → compile (-Werror, Error Prone, NullAway) → tests (+ArchUnit) → JaCoCo gate
# scripts/mvn.sh uses a local mvn if present, otherwise Maven + JDK 25 in Docker (docker-compose.yml)
```

## Recipe: add a use case (example: content module)

1. `content/domain/` — records and value objects; enforce invariants in constructors
   (`ContentItem`, `License`).
2. `content/application/port/in/` — use-case interface (`ListPublishedContentUseCase`).
3. `content/application/port/out/` — what the use case needs (`LoadContentPort`).
4. `content/application/service/` — implementation, no Spring annotations (`ContentService`).
5. `content/adapter/out/persistence/` — `@Entity`, Spring Data repository, mapper and an
   `*Adapter` that implements the port.out interface.
6. `content/adapter/in/web/` — controller injects the port.in interface; response record;
   map new exceptions in `ApiExceptionHandler`.
7. `config/` — wire the service and adapter as `@Bean`s.
8. Tests: domain unit tests, service test with a fake port, `*IntegrationTest` over HTTP.
9. Frontend contract: update the zod schema and `docs/api-contract.md` in the same change.

## Compile-time rules you will hit

- **NullAway**: everything is non-null by default. Return `Optional<T>` from finders; use
  `@org.jspecify.annotations.Nullable` only when null is a legitimate value.
- **`-Werror`**: every javac lint warning and every Error Prone warning fails the build
  (e.g. swallowed exception causes, missing `@Override`, default-charset/locale use).
- **Clock**: `Instant.now()` is banned by ArchUnit — use `Instant.now(clock)`.
- **Exceptions**: never `throw new RuntimeException(...)`; domain errors extend `DomainException`
  and get an HTTP mapping in `ApiExceptionHandler`.
- **Banned deps** (enforcer): Lombok, JUnit 4, log4j 1, Joda-Time.
- **Database**: PostgreSQL 18 (Docker, profile `postgres`); tests use H2 in PostgreSQL mode.
  Schema changes are Flyway migrations in `src/main/resources/db/migration` (`V<n>__<name>.sql`,
  portable SQL, never edit an applied one); `ddl-auto=validate` checks entities against them.
- **Hibernate/JPA**: allowed. Entities only in `adapter/out/persistence/`, mapped to domain
  records by a mapper; `open-in-view` stays off.
- **DeepSeek**: only from `adapter/out/llm/` or `adapter/out/asr/` (ArchUnit
  `llm_only_in_llm_adapter`). Tests use recorded responses, never the real API.
