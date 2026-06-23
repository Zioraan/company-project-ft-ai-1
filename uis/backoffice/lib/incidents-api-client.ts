import {
  PlatformApiError,
  platformApiDownload,
  platformApiRequest,
} from "@/lib/platform-api-client";

export class IncidentsApiError extends PlatformApiError {
  constructor(message: string, status: number, payload: unknown) {
    super(message, status, payload);
    this.name = "IncidentsApiError";
  }
}

async function incidentsApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return await platformApiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      throw new IncidentsApiError(error.message, error.status, error.payload);
    }
    throw error;
  }
}

export { incidentsApiRequest };

export async function incidentsApiDownload(path: string): Promise<Blob> {
  try {
    return await platformApiDownload(path);
  } catch (error) {
    if (error instanceof PlatformApiError) {
      throw new IncidentsApiError(error.message, error.status, error.payload);
    }
    throw error;
  }
}
