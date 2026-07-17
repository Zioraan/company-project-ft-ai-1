import { getAccessToken } from "@/lib/auth-token";

export const TELEMETRY_SCHEMA_VERSION = "1.0.0";
export const TELEMETRY_FLUSH_INTERVAL_MS = 10_000;
export const TELEMETRY_MAX_QUEUE_SIZE = 20;
export const TELEMETRY_MAX_RETRIES = 3;
export const ANONYMOUS_USER_ID = "anonymous";

const SESSION_STORAGE_KEY = "nexova_telemetry_session_id";

export type TelemetryProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export type TelemetryEventEnvelope = {
  eventId: string;
  timestamp: string;
  sessionId: string;
  userId: string;
  event_type: string;
  schemaVersion: string;
  requestId: string;
  properties: Record<string, string | number | boolean>;
};

type FlushTransport = (url: string, body: string) => Promise<boolean>;

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function decodeJwtSub(token: string): string | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

export function getTelemetryUserId(): string {
  const token = getAccessToken();
  if (!token) {
    return ANONYMOUS_USER_ID;
  }
  return decodeJwtSub(token) ?? ANONYMOUS_USER_ID;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return createUuid();
  }
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const created = createUuid();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

/** Create a fresh session id (call on successful login). */
export function rotateTelemetrySessionId(): string {
  const created = createUuid();
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  }
  return created;
}

export function clearTelemetrySessionId(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

const BLOCKED_PROPERTY_KEYS = new Set([
  "email",
  "name",
  "password",
  "current_password",
  "new_password",
]);

function sanitizeProperties(
  properties: TelemetryProperties,
): Record<string, string | number | boolean> {
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (BLOCKED_PROPERTY_KEYS.has(key.toLowerCase())) {
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

function defaultFetchTransport(url: string, body: string): Promise<boolean> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  })
    .then((response) => response.ok)
    .catch(() => false);
}

function sendBeaconTransport(url: string, body: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    return Promise.resolve(navigator.sendBeacon(url, blob));
  }
  return defaultFetchTransport(url, body);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class TelemetryService {
  private queue: TelemetryEventEnvelope[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;
  private visibilityBound = false;
  private readonly endpoint: string;
  private readonly transport: FlushTransport;
  private readonly beaconTransport: FlushTransport;
  private readonly enableInterval: boolean;

  constructor(options?: {
    endpoint?: string;
    transport?: FlushTransport;
    beaconTransport?: FlushTransport;
    enableInterval?: boolean;
  }) {
    this.endpoint =
      options?.endpoint ??
      process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ??
      "http://localhost:8000/telemetry/events";
    this.transport = options?.transport ?? defaultFetchTransport;
    this.beaconTransport = options?.beaconTransport ?? sendBeaconTransport;
    this.enableInterval = options?.enableInterval ?? true;
  }

  track(eventType: string, properties: TelemetryProperties = {}): void {
    if (typeof window === "undefined") {
      return;
    }

    this.ensureLifecycle();

    const event: TelemetryEventEnvelope = {
      eventId: createUuid(),
      timestamp: new Date().toISOString(),
      sessionId: getOrCreateSessionId(),
      userId: getTelemetryUserId(),
      event_type: eventType,
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      requestId: createUuid(),
      properties: sanitizeProperties(properties),
    };

    this.queue.push(event);

    if (this.queue.length >= TELEMETRY_MAX_QUEUE_SIZE) {
      void this.flush();
    }
  }

  async flush(options?: { useBeacon?: boolean }): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return;
    }

    this.flushing = true;
    const batch = this.queue.splice(0, this.queue.length);
    const body = JSON.stringify({ events: batch });
    const transport = options?.useBeacon ? this.beaconTransport : this.transport;

    try {
      let delivered = false;
      for (let attempt = 0; attempt < TELEMETRY_MAX_RETRIES; attempt += 1) {
        delivered = await transport(this.endpoint, body);
        if (delivered) {
          break;
        }
        const backoffMs = 250 * 2 ** attempt;
        await sleep(backoffMs);
      }

      if (!delivered) {
        // Drop after max retries per plan.
        return;
      }
    } finally {
      this.flushing = false;
    }
  }

  /** Test/helpers */
  getQueueLength(): number {
    return this.queue.length;
  }

  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (typeof document !== "undefined" && this.visibilityBound) {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      this.visibilityBound = false;
    }
  }

  private ensureLifecycle(): void {
    if (this.enableInterval && this.flushTimer == null) {
      this.flushTimer = setInterval(() => {
        void this.flush();
      }, TELEMETRY_FLUSH_INTERVAL_MS);
    }

    if (typeof document !== "undefined" && !this.visibilityBound) {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
      this.visibilityBound = true;
    }
  }

  private onVisibilityChange = (): void => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      void this.flush({ useBeacon: true });
    }
  };
}

let sharedService: TelemetryService | null = null;

export function getTelemetryService(): TelemetryService {
  if (!sharedService) {
    sharedService = new TelemetryService();
  }
  return sharedService;
}

export function track(
  eventType: string,
  properties: TelemetryProperties = {},
): void {
  getTelemetryService().track(eventType, properties);
}

/** Reset shared singleton (tests). */
export function resetTelemetryServiceForTests(): void {
  sharedService?.dispose();
  sharedService = null;
}
