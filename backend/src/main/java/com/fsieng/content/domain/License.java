package com.fsieng.content.domain;

import org.jspecify.annotations.Nullable;

/**
 * How we are allowed to use a piece of material. Only publishable licenses may reach learners;
 * {@link DevOnly} material (copyrighted, licence not yet obtained) is for development only.
 */
public sealed interface License
    permits License.PublicDomainUsGov,
        License.CcBy,
        License.Generated,
        License.DevOnly,
        License.Licensed {

  boolean publishable();

  String kind();

  /** U.S. government work, e.g. FSI courses or VOA-produced material. */
  record PublicDomainUsGov() implements License {
    @Override
    public boolean publishable() {
      return true;
    }

    @Override
    public String kind() {
      return "public-domain-us-gov";
    }
  }

  /** Creative Commons Attribution; the attribution line is shown with the material. */
  record CcBy(String attribution) implements License {
    public CcBy {
      requireText(attribution, "CC BY attribution");
    }

    @Override
    public boolean publishable() {
      return true;
    }

    @Override
    public String kind() {
      return "cc-by";
    }
  }

  /** Written by the system (an LLM) and owned by us; publishable once reviewed. */
  record Generated(String generator) implements License {
    public Generated {
      requireText(generator, "generator");
    }

    @Override
    public boolean publishable() {
      return true;
    }

    @Override
    public String kind() {
      return "generated";
    }
  }

  /** Copyrighted material used for development and testing only. Never published. */
  record DevOnly() implements License {
    @Override
    public boolean publishable() {
      return false;
    }

    @Override
    public String kind() {
      return "dev-only";
    }
  }

  /** Copyrighted material we hold a licence for; the grant id points to the contract. */
  record Licensed(String grantId) implements License {
    public Licensed {
      requireText(grantId, "licence grant id");
    }

    @Override
    public boolean publishable() {
      return true;
    }

    @Override
    public String kind() {
      return "licensed";
    }
  }

  /** Builds a license from its stored form: a kind plus the kind's detail value, if any. */
  static License of(String kind, @Nullable String detail) {
    return switch (kind) {
      case "public-domain-us-gov" -> new PublicDomainUsGov();
      case "cc-by" -> new CcBy(requireDetail(kind, detail));
      case "generated" -> new Generated(requireDetail(kind, detail));
      case "dev-only" -> new DevOnly();
      case "licensed" -> new Licensed(requireDetail(kind, detail));
      default -> throw new InvalidContentException("unknown license kind: " + kind);
    };
  }

  /** The kind-specific value that {@link #of} needs back, or null for kinds without one. */
  static @Nullable String detailOf(License license) {
    if (license instanceof CcBy ccBy) {
      return ccBy.attribution();
    }
    if (license instanceof Generated generated) {
      return generated.generator();
    }
    if (license instanceof Licensed licensed) {
      return licensed.grantId();
    }
    return null;
  }

  private static String requireDetail(String kind, @Nullable String detail) {
    if (detail == null) {
      throw new InvalidContentException("license " + kind + " needs a detail value");
    }
    return detail;
  }

  private static void requireText(String value, String what) {
    if (value.isBlank()) {
      throw new InvalidContentException(what + " must not be blank");
    }
  }
}
