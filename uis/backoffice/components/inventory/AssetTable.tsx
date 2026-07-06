import Link from "next/link";
import { StockStatusBadge } from "@/components/inventory/StockStatusBadge";
import { mapCategoryLabel } from "@/lib/inventory-mappers";
import type { Asset } from "@/types/inventory";

interface AssetTableProps {
  assets: Asset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  if (assets.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No assets registered yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Asset
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              SKU
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Category
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Office
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Stock
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                {asset.name}
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                {asset.sku}
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                {mapCategoryLabel(asset.category)}
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                {asset.office}
              </td>
              <td className="px-4 py-3">
                <StockStatusBadge currentStock={asset.current_stock} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/inventory/orders/inbound?asset_id=${asset.id}`}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Inbound
                  </Link>
                  <Link
                    href={`/inventory/orders/outbound?asset_id=${asset.id}`}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Outbound
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
