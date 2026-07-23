/**
 * Normalize inventory/API error messages into telemetry failure_reason codes.
 */

export function mapProcurementFailureReason(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("not found")) {
    return "asset_not_found";
  }
  if (lower.includes("supplier") || lower.includes("vendor")) {
    return "invalid_supplier";
  }
  if (lower.includes("quantity")) {
    return "invalid_quantity";
  }
  return "api_rejected";
}

export function mapAssignmentFailureReason(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("insufficient")) {
    return "insufficient_stock";
  }
  if (lower.includes("assigned_to") || lower.includes("assigned to")) {
    return "missing_assigned_to";
  }
  if (lower.includes("not found")) {
    return "asset_not_found";
  }
  return "api_rejected";
}
