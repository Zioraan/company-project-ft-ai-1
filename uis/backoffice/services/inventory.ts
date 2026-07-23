import { inventoryApiRequest } from "@/lib/inventory-api-client";
import type {
  Asset,
  AssetCreateInput,
  AssetEntry,
  AssetEntryCreateInput,
  AssetExit,
  AssetExitCreateInput,
  OrderHistoryItem,
} from "@/types/inventory";

export async function getAssets(): Promise<Asset[]> {
  return inventoryApiRequest<Asset[]>("/inventory/products");
}

export async function getAssetById(id: number): Promise<Asset> {
  return inventoryApiRequest<Asset>(`/inventory/products/${id}`);
}

export async function createAsset(input: AssetCreateInput): Promise<Asset> {
  return inventoryApiRequest<Asset>("/inventory/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createAssetEntry(
  input: AssetEntryCreateInput,
): Promise<AssetEntry> {
  return inventoryApiRequest<AssetEntry>("/inventory/orders/inbound", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createAssetExit(
  input: AssetExitCreateInput,
): Promise<AssetExit> {
  return inventoryApiRequest<AssetExit>("/inventory/orders/outbound", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getOrderHistory(): Promise<OrderHistoryItem[]> {
  return inventoryApiRequest<OrderHistoryItem[]>("/inventory/orders");
}
