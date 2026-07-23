import {
  PlatformApiError,
  platformApiDownload,
  platformApiRequest,
} from "@/lib/platform-api-client";

export class SuppliersApiError extends PlatformApiError {
  constructor(message: string, status: number, payload: unknown) {
    super(message, status, payload);
    this.name = "SuppliersApiError";
  }
}

async function suppliersApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return await platformApiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      throw new SuppliersApiError(error.message, error.status, error.payload);
    }
    throw error;
  }
}

export { suppliersApiRequest };

export async function suppliersApiDownload(path: string): Promise<Blob> {
  try {
    return await platformApiDownload(path);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      throw new SuppliersApiError(error.message, error.status, error.payload);
    }
    throw error;
  }
}
