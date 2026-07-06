import { clearAccessToken, getAccessToken } from "@/lib/auth-token";

const PLATFORM_API_BASE_URL =
  process.env.NEXT_PUBLIC_INCIDENTS_API_URL ?? "http://localhost:8000";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE = "Unable to reach the server.";
export const INVALID_RESPONSE_MESSAGE = "Invalid server response.";

export class PlatformApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "PlatformApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type PlatformRequestOptions = {
  public?: boolean;
};

function formatValidationDetail(detail: unknown): string | null {
  if (!Array.isArray(detail)) {
    return null;
  }

  const messages = detail
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "msg" in item &&
        typeof (item as { msg?: unknown }).msg === "string"
      ) {
        const field =
          "loc" in item && Array.isArray((item as { loc?: unknown }).loc)
            ? (item as { loc: unknown[] }).loc
                .filter((part) => typeof part === "string")
                .join(".")
            : "field";
        return `${field}: ${(item as { msg: string }).msg}`;
      }
      return null;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length > 0 ? messages.join("; ") : null;
}

export function parseErrorMessage(
  response: Response,
  payload: unknown,
): string {
  const status = response.status;

  if (status >= 500) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload
  ) {
    const detail = (payload as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    const validationMessage = formatValidationDetail(detail);
    if (validationMessage) {
      return validationMessage;
    }
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  return GENERIC_ERROR_MESSAGE;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function handleUnauthorized(tokenWasSent: boolean): void {
  if (!tokenWasSent) {
    return;
  }

  clearAccessToken();
  if (unauthorizedHandler) {
    unauthorizedHandler();
    return;
  }

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new PlatformApiError(NETWORK_ERROR_MESSAGE, 0, null);
  }
}

async function parseResponsePayload(response: Response): Promise<unknown> {
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
    throw new PlatformApiError(
      INVALID_RESPONSE_MESSAGE,
      response.status,
      null,
    );
  }
}

export async function platformApiRequest<T>(
  path: string,
  init?: RequestInit,
  options: PlatformRequestOptions = {},
): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = options.public ? null : getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await safeFetch(`${PLATFORM_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseResponsePayload(response);

  if (response.status === 401) {
    handleUnauthorized(Boolean(token));
  }

  if (!response.ok) {
    const message = parseErrorMessage(response, payload);
    throw new PlatformApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function platformApiDownload(
  path: string,
  options: PlatformRequestOptions = {},
): Promise<Blob> {
  const headers = new Headers();
  const token = options.public ? null : getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await safeFetch(`${PLATFORM_API_BASE_URL}${path}`, {
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    handleUnauthorized(Boolean(token));
  }

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    const message = parseErrorMessage(response, payload);
    throw new PlatformApiError(message, response.status, payload);
  }

  try {
    return await response.blob();
  } catch {
    throw new PlatformApiError(
      INVALID_RESPONSE_MESSAGE,
      response.status,
      null,
    );
  }
}
