const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://playground.4geeks.com/tracker/api/v1";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE = "Unable to reach the server.";
export const INVALID_RESPONSE_MESSAGE = "Invalid server response.";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, null);
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    if (response.status === 204) {
      return null;
    }

    return await response.text();
  } catch {
    throw new ApiError(INVALID_RESPONSE_MESSAGE, response.status, null);
  }
}

function parseErrorMessage(response: Response, payload: unknown): string {
  const status = response.status;

  if (status >= 500) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string" &&
    status < 500
  ) {
    return (payload as { error: string }).error;
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  return GENERIC_ERROR_MESSAGE;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await safeFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const message = parseErrorMessage(response, payload);
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
