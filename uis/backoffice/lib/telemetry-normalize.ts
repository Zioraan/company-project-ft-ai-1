/**
 * Normalize inventory domain values to canonical telemetry allowlist values.
 */

const OFFICE_MAP: Record<string, string> = {
  Valencia: "valencia",
  Miami: "miami",
  valencia: "valencia",
  miami: "miami",
};

/** Map product categories to Nexova material telemetry allowlist. */
const CATEGORY_MAP: Record<string, string> = {
  training_kit: "training_kit",
  certification: "certification",
  onboarding_equipment: "onboarding_equipment",
  // Legacy inventory values → nearest material category
  hardware: "onboarding_equipment",
  peripherals: "onboarding_equipment",
  peripheral: "onboarding_equipment",
  office_supplies: "onboarding_equipment",
  training_materials: "training_kit",
  consumable: "training_kit",
  furniture: "onboarding_equipment",
  software_licence: "certification",
};

const CURRENCY_BY_OFFICE: Record<string, string> = {
  valencia: "EUR",
  miami: "USD",
  Valencia: "EUR",
  Miami: "USD",
};

export function normalizeOffice(office: string | null | undefined): string | undefined {
  if (office == null || office === "") {
    return undefined;
  }
  return OFFICE_MAP[office] ?? office.toLowerCase();
}

export function normalizeCategory(
  category: string | null | undefined,
): string | undefined {
  if (category == null || category === "") {
    return undefined;
  }
  return CATEGORY_MAP[category] ?? category;
}

export function currencyForOffice(
  office: string | null | undefined,
): string | undefined {
  if (office == null || office === "") {
    return undefined;
  }
  return CURRENCY_BY_OFFICE[office] ?? CURRENCY_BY_OFFICE[office.toLowerCase()];
}
