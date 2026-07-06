import {
  PlatformApiError,
  platformApiRequest,
} from "@/lib/platform-api-client";

export class InventoryApiError extends PlatformApiError {
  constructor(message: string, status: number, payload: unknown) {
    super(message, status, payload);
    this.name = "InventoryApiError";
  }
}

async function inventoryApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return await platformApiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      throw new InventoryApiError(error.message, error.status, error.payload);
    }
    throw error;
  }
}

export { inventoryApiRequest };
