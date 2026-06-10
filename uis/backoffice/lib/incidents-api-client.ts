const INCIDENTS_API_BASE_URL =
  process.env.NEXT_PUBLIC_INCIDENTS_API_URL ?? "http://localhost:8000";

export class IncidentsApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "IncidentsApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseErrorMessage(
  response: Response,
  payload: unknown,
): Promise<string> {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }

  return `Request failed with status ${response.status}`;
}

export async function incidentsApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${INCIDENTS_API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = await parseErrorMessage(response, payload);
    throw new IncidentsApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function incidentsApiDownload(path: string): Promise<Blob> {
  const response = await fetch(`${INCIDENTS_API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const message = await parseErrorMessage(response, payload);
    throw new IncidentsApiError(message, response.status, payload);
  }

  return response.blob();
}
