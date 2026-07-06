export const ASSET_CATEGORIES = [
  "hardware",
  "peripherals",
  "office_supplies",
  "training_materials",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_OFFICES = ["Valencia", "Miami"] as const;
export type AssetOffice = (typeof ASSET_OFFICES)[number];

export const EXIT_TYPES = ["allocation", "consumption"] as const;
export type ExitType = (typeof EXIT_TYPES)[number];

export const ORDER_TYPES = ["inbound", "outbound"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export interface Asset {
  id: number;
  name: string;
  sku: string;
  category: AssetCategory;
  office: AssetOffice;
  current_stock: number;
}

export interface AssetCreateInput {
  name: string;
  sku: string;
  category: AssetCategory;
  office: AssetOffice;
}

export interface AssetEntryCreateInput {
  asset_id: number;
  quantity: number;
  supplier: string;
  office: AssetOffice;
}

export interface AssetExitCreateInput {
  asset_id: number;
  quantity: number;
  exit_type: ExitType;
  assigned_to?: string | null;
  office: AssetOffice;
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
