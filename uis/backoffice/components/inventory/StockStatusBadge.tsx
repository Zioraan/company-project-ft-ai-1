import {
  getStockStatus,
  mapStockStatusLabel,
  type StockStatus,
} from "@/lib/inventory-mappers";

const STATUS_STYLES: Record<StockStatus, string> = {
  critical:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900",
  low: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  ok: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
};

interface StockStatusBadgeProps {
  currentStock: number;
}

export function StockStatusBadge({ currentStock }: StockStatusBadgeProps) {
  const status = getStockStatus(currentStock);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {mapStockStatusLabel(status)} ({currentStock})
    </span>
  );
}
