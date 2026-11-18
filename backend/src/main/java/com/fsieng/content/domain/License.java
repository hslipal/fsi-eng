package com.fsieng.content.domain;

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

  private static void requireText(String value, String what) {
    if (value.isBlank()) {
      throw new InvalidContentException(what + " must not be blank");
    }
  }
}
