import type {
  SupplierCategory,
  SupplierCountry,
  SupplierStatus,
} from "@/types/suppliers";

export const CATEGORY_LABELS: Record<SupplierCategory, string> = {
  job_boards: "Job Boards",
  ats_software: "ATS Software",
  assessment_tools: "Assessment Tools",
  training_platforms: "Training Platforms",
  payroll_and_hr_software: "Payroll and HR Software",
  video_interview: "Video Interview",
  background_check: "Background Check",
  office_and_facilities: "Office and Facilities",
  it_and_software_licenses: "IT and Software Licenses",
};

export const STATUS_LABELS: Record<SupplierStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const COUNTRY_OPTIONS: Array<{ value: SupplierCountry; label: string }> =
  [
    { value: "Spain", label: "Spain" },
    { value: "USA", label: "USA" },
  ];

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({
    value: value as SupplierCategory,
    label,
  }),
);

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as SupplierStatus,
    label,
  }),
);

export function mapCategoryLabel(category: SupplierCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function mapCategoriesLabel(categories: SupplierCategory[]): string {
  return categories.map(mapCategoryLabel).join(", ");
}

export function mapStatusLabel(status: SupplierStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function supplierStatusVariant(
  status: SupplierStatus,
): "active" | "suspended" {
  return status === "active" ? "active" : "suspended";
}

const RENEWAL_SOON_DAYS = 60;

export function isRenewalSoon(
  contractRenewalDate?: string | null,
  referenceDate: Date = new Date(),
): boolean {
  if (!contractRenewalDate) {
    return false;
  }

  const renewalDate = new Date(`${contractRenewalDate}T00:00:00`);
  if (Number.isNaN(renewalDate.getTime())) {
    return false;
  }

  const diffMs = renewalDate.getTime() - referenceDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= RENEWAL_SOON_DAYS;
}

export function formatMonthlyRate(
  monthlyRate: number,
  currency: string,
): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(monthlyRate);
}

export function formatRateUpdatedAt(rateUpdatedAt: string): string {
  const date = new Date(rateUpdatedAt);
  if (Number.isNaN(date.getTime())) {
    return rateUpdatedAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
