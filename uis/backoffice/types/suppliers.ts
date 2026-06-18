export const SUPPLIER_CATEGORIES = [
  "job_boards",
  "ats_software",
  "assessment_tools",
  "training_platforms",
  "payroll_and_hr_software",
  "video_interview",
  "background_check",
  "office_and_facilities",
  "it_and_software_licenses",
] as const;

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

export const SUPPLIER_STATUSES = ["active", "suspended"] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export const SUPPLIER_COUNTRIES = ["Spain", "USA"] as const;
export type SupplierCountry = (typeof SUPPLIER_COUNTRIES)[number];

export const SUPPLIER_CURRENCIES = ["EUR", "USD"] as const;
export type SupplierCurrency = (typeof SUPPLIER_CURRENCIES)[number];

export interface Supplier {
  id: string;
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  monthly_rate: number;
  currency: SupplierCurrency;
  rate_updated_at: string;
  status: SupplierStatus;
  contract_renewal_date?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

export interface SupplierCreateInput {
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  monthly_rate: number;
  currency: SupplierCurrency;
  status: SupplierStatus;
  contract_renewal_date?: string;
  contact_email?: string;
  notes?: string;
}

export interface SupplierRateUpdateInput {
  monthly_rate: number;
}

export interface SupplierStatusUpdateInput {
  status: SupplierStatus;
}

export interface SupplierFilters {
  country?: SupplierCountry;
  category?: SupplierCategory;
}

export type SupplierApiResponse = Supplier;
