export const ASSET_CATEGORIES = [
  "training_kit",
  "certification",
  "onboarding_equipment",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_OFFICES = ["Valencia", "Miami"] as const;
export type AssetOffice = (typeof ASSET_OFFICES)[number];

export const EXIT_TYPES = ["allocation", "consumption"] as const;
export type ExitType = (typeof EXIT_TYPES)[number];

export const ORDER_TYPES = ["inbound", "outbound"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export type CurrencyCode = "EUR" | "USD";

export interface Asset {
  id: number;
  name: string;
  sku: string;
  category: AssetCategory;
  office: AssetOffice;
  programme_id: string;
  reorder_threshold: number;
  current_stock: number;
}

export interface AssetCreateInput {
  name: string;
  sku: string;
  category: AssetCategory;
  office: AssetOffice;
  programme_id: string;
  reorder_threshold?: number;
}

export interface AssetEntryCreateInput {
  asset_id: number;
  quantity: number;
  supplier: string;
  office: AssetOffice;
  unit_cost: number;
  currency?: CurrencyCode;
}

export interface AssetEntry {
  id: number;
  asset_id: number;
  quantity: number;
  supplier: string;
  office: AssetOffice;
  currency: CurrencyCode;
  unit_cost: number;
  created_at: string;
  user_uuid: string;
  programme_id: string;
  product_category: AssetCategory;
  cost_variance_detected: boolean;
  previous_unit_cost: number | null;
}

export interface AssetExitCreateInput {
  asset_id: number;
  quantity: number;
  exit_type: ExitType;
  assigned_to?: string | null;
  office: AssetOffice;
}

export interface AssetExit {
  id: number;
  asset_id: number;
  quantity: number;
  exit_type: ExitType;
  assigned_to: string | null;
  office: AssetOffice;
  created_at: string;
  user_uuid: string;
  programme_id: string;
  product_category: AssetCategory;
  currency: CurrencyCode;
  current_stock: number;
  reorder_threshold: number;
  stock_threshold_triggered: boolean;
}

export interface OrderHistoryItem {
  id: number;
  order_type: OrderType;
  asset_id: number;
  asset_name: string;
  quantity: number;
  created_at: string;
  user_uuid: string;
  supplier?: string | null;
  exit_type?: ExitType | null;
  assigned_to?: string | null;
  office: AssetOffice;
}
