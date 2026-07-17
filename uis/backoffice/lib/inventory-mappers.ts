import type {
  AssetCategory,
  AssetOffice,
  ExitType,
  OrderType,
} from "@/types/inventory";

// Stock status thresholds for visual indicators:
// - critical: 0 units (red)
// - low: 1-5 units (amber)
// - ok: 6+ units (green)
export const STOCK_THRESHOLDS = {
  critical: 0,
  lowMax: 5,
} as const;

export type StockStatus = "critical" | "low" | "ok";

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  training_kit: "Training kit",
  certification: "Certification",
  onboarding_equipment: "Onboarding equipment",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  allocation: "Allocation",
  consumption: "Consumption",
};

export const OFFICE_OPTIONS: Array<{ value: AssetOffice; label: string }> = [
  { value: "Valencia", label: "Valencia" },
  { value: "Miami", label: "Miami" },
];

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({
    value: value as AssetCategory,
    label,
  }),
);

export const EXIT_TYPE_OPTIONS = Object.entries(EXIT_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as ExitType,
    label,
  }),
);

export function mapCategoryLabel(category: AssetCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function mapOrderTypeLabel(orderType: OrderType): string {
  return ORDER_TYPE_LABELS[orderType] ?? orderType;
}

export function mapExitTypeLabel(exitType: ExitType): string {
  return EXIT_TYPE_LABELS[exitType] ?? exitType;
}

export function getStockStatus(currentStock: number): StockStatus {
  if (currentStock <= STOCK_THRESHOLDS.critical) {
    return "critical";
  }
  if (currentStock <= STOCK_THRESHOLDS.lowMax) {
    return "low";
  }
  return "ok";
}

export function mapStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "critical":
      return "Out of stock";
    case "low":
      return "Low stock";
    default:
      return "In stock";
  }
}

export function formatOrderDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
