const SUPPLIERS_API_BASE_URL =
  process.env.NEXT_PUBLIC_INCIDENTS_API_URL ?? "http://localhost:8000";

export class SuppliersApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "SuppliersApiError";
    this.status = status;
    this.payload = payload;
  }
}

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

async function parseErrorMessage(
  response: Response,
  payload: unknown,
): Promise<string> {
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
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }

  return `Request failed with status ${response.status}`;
}

export async function suppliersApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${SUPPLIERS_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = await parseErrorMessage(response, payload);
    throw new SuppliersApiError(message, response.status, payload);
  }

  return payload as T;
}
