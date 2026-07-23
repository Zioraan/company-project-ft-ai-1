import {
  formatOrderDate,
  mapExitTypeLabel,
  mapOrderTypeLabel,
} from "@/lib/inventory-mappers";
import type { OrderHistoryItem } from "@/types/inventory";

interface OrderHistoryTableProps {
  orders: OrderHistoryItem[];
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        No asset entries or exits recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Type
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Asset
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Quantity
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Date
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
              Registered by
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {orders.map((order) => {
            const isInbound = order.order_type === "inbound";
            return (
              <tr key={`${order.order_type}-${order.id}`}>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isInbound
                        ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                        : "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                    }`}
                  >
                    {mapOrderTypeLabel(order.order_type)}
                    {!isInbound && order.exit_type
                      ? ` · ${mapExitTypeLabel(order.exit_type)}`
                      : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {order.asset_name}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {order.quantity}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {formatOrderDate(order.created_at)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                  {order.user_uuid}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
