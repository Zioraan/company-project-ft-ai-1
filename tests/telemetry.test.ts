import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

function encodeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe("telemetry-normalize", () => {
  it("normalizes offices and categories to canonical telemetry values", async () => {
    const { normalizeCategory, normalizeOffice } = await import(
      "../uis/backoffice/lib/telemetry-normalize"
    );

    expect(normalizeOffice("Valencia")).toBe("valencia");
    expect(normalizeOffice("Miami")).toBe("miami");
    expect(normalizeCategory("training_kit")).toBe("training_kit");
    expect(normalizeCategory("certification")).toBe("certification");
    expect(normalizeCategory("onboarding_equipment")).toBe("onboarding_equipment");
    expect(normalizeCategory("peripherals")).toBe("onboarding_equipment");
    expect(normalizeCategory("training_materials")).toBe("training_kit");
    expect(normalizeCategory("hardware")).toBe("onboarding_equipment");
  });

  it("handles null, empty, and unknown normalize inputs", async () => {
    const { normalizeCategory, normalizeOffice } = await import(
      "../uis/backoffice/lib/telemetry-normalize"
    );

    expect(normalizeOffice(null)).toBeUndefined();
    expect(normalizeOffice(undefined)).toBeUndefined();
    expect(normalizeOffice("")).toBeUndefined();
    expect(normalizeOffice("Lisbon")).toBe("lisbon");

    expect(normalizeCategory(null)).toBeUndefined();
    expect(normalizeCategory(undefined)).toBeUndefined();
    expect(normalizeCategory("")).toBeUndefined();
    expect(normalizeCategory("custom_kit")).toBe("custom_kit");
  });
});

describe("telemetry-failure-reasons", () => {
  it("maps procurement API and validation failure messages", async () => {
    const { mapProcurementFailureReason } = await import(
      "../uis/backoffice/lib/telemetry-failure-reasons"
    );

    expect(mapProcurementFailureReason("Asset not found")).toBe("asset_not_found");
    expect(mapProcurementFailureReason("Unknown supplier")).toBe("invalid_supplier");
    expect(mapProcurementFailureReason("Invalid vendor code")).toBe(
      "invalid_supplier",
    );
    expect(mapProcurementFailureReason("Quantity must be positive")).toBe(
      "invalid_quantity",
    );
    expect(mapProcurementFailureReason("Something exploded")).toBe("api_rejected");
    expect(mapProcurementFailureReason("")).toBe("api_rejected");
  });

  it("maps assignment API and validation failure messages", async () => {
    const { mapAssignmentFailureReason } = await import(
      "../uis/backoffice/lib/telemetry-failure-reasons"
    );

    expect(mapAssignmentFailureReason("Insufficient stock for exit")).toBe(
      "insufficient_stock",
    );
    expect(mapAssignmentFailureReason("assigned_to is required")).toBe(
      "missing_assigned_to",
    );
    expect(mapAssignmentFailureReason("Assigned to is required")).toBe(
      "missing_assigned_to",
    );
    expect(mapAssignmentFailureReason("Asset not found")).toBe("asset_not_found");
    expect(mapAssignmentFailureReason("Unexpected failure")).toBe("api_rejected");
  });
});

describe("TelemetryService", () => {
  let visibilityHandler: (() => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    visibilityHandler = null;
    const localStorage = createStorageMock();
    const sessionStorage = createStorageMock();
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
    });
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "visibilitychange") {
          visibilityHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        .mockReturnValueOnce("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
        .mockReturnValueOnce("cccccccc-cccc-4ccc-8ccc-cccccccccccc")
        .mockReturnValue("dddddddd-dddd-4ddd-8ddd-dddddddddddd"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("enriches envelope fields and flushes by queue size", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const {
      TELEMETRY_MAX_QUEUE_SIZE,
      TelemetryService,
      resetTelemetryServiceForTests,
    } = await import("../uis/backoffice/services/telemetry");
    resetTelemetryServiceForTests();

    const service = new TelemetryService({
      endpoint: "http://localhost:8000/telemetry/events",
      transport,
      enableInterval: false,
    });

    for (let i = 0; i < TELEMETRY_MAX_QUEUE_SIZE; i += 1) {
      service.track("asset_list_viewed", {
        view_source: "nav_menu",
        result_count: i,
      });
    }

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(transport).toHaveBeenCalled();
    const firstCall = transport.mock.calls.at(0);
    expect(firstCall?.[1]).toEqual(expect.any(String));
    const parsed = JSON.parse(String(firstCall?.[1])) as {
      events: Array<Record<string, unknown>>;
    };
    expect(parsed.events).toHaveLength(TELEMETRY_MAX_QUEUE_SIZE);
    expect(parsed.events[0]).toMatchObject({
      eventId: expect.any(String),
      timestamp: expect.any(String),
      sessionId: expect.any(String),
      userId: "anonymous",
      event_type: "asset_list_viewed",
      schemaVersion: "1.0.0",
      requestId: expect.any(String),
      properties: { view_source: "nav_menu", result_count: 0 },
    });
    service.dispose();
  });

  it("flushes on the 10 second timer interval", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const {
      TELEMETRY_FLUSH_INTERVAL_MS,
      TelemetryService,
      resetTelemetryServiceForTests,
    } = await import("../uis/backoffice/services/telemetry");
    resetTelemetryServiceForTests();

    const service = new TelemetryService({
      transport,
      enableInterval: true,
    });

    service.track("office_filter_applied", { office: "valencia" });
    expect(transport).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(TELEMETRY_FLUSH_INTERVAL_MS);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(service.getQueueLength()).toBe(0);
    service.dispose();
  });

  it("flushes with sendBeacon when visibility becomes hidden", async () => {
    const beaconTransport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({
      transport,
      beaconTransport,
      enableInterval: false,
    });

    service.track("session_expired", {});
    expect(visibilityHandler).toBeTypeOf("function");

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    visibilityHandler?.();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(beaconTransport).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
    service.dispose();
  });

  it("retries with backoff then drops failed batches", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => false,
    );
    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({
      endpoint: "http://localhost:8000/telemetry/events",
      transport,
      enableInterval: false,
    });

    service.track("user_login_failed", {
      failure_reason: "invalid_credentials",
    });
    const flushPromise = service.flush();
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromise;

    expect(transport).toHaveBeenCalledTimes(3);
    expect(service.getQueueLength()).toBe(0);
    service.dispose();
  });

  it("succeeds on a later retry after transient failures", async () => {
    const transport = vi
      .fn<(url: string, body: string) => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({
      transport,
      enableInterval: false,
    });

    service.track("inbound_order_failed", {
      office: "miami",
      failure_reason: "invalid_quantity",
    });
    const flushPromise = service.flush();
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromise;

    expect(transport).toHaveBeenCalledTimes(3);
    expect(service.getQueueLength()).toBe(0);
    service.dispose();
  });

  it("strips email, name, and password from properties", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({ transport, enableInterval: false });
    service.track("user_login_failed", {
      failure_reason: "invalid_credentials",
      email: "should-not-exist@example.com",
      password: "secret",
      name: "Ada Lovelace",
    });

    const flushPromise = service.flush();
    await vi.advanceTimersByTimeAsync(0);
    await flushPromise;

    const firstCall = transport.mock.calls.at(0);
    expect(firstCall?.[1]).toEqual(expect.any(String));
    const parsed = JSON.parse(String(firstCall?.[1])) as {
      events: Array<{ properties: Record<string, unknown> }>;
    };
    expect(parsed.events[0]?.properties).toEqual({
      failure_reason: "invalid_credentials",
    });
    service.dispose();
  });

  it("omits null and undefined property values", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({ transport, enableInterval: false });
    service.track("outbound_order_failed", {
      office: "valencia",
      product_id: null,
      product_category: undefined,
      failure_reason: "missing_asset",
    });

    await service.flush();
    const parsed = JSON.parse(String(transport.mock.calls.at(0)?.[1])) as {
      events: Array<{ properties: Record<string, unknown> }>;
    };
    expect(parsed.events[0]?.properties).toEqual({
      office: "valencia",
      failure_reason: "missing_asset",
    });
    service.dispose();
  });

  it("uses JWT sub as userId when authenticated", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    window.localStorage.setItem(
      "nexova_access_token",
      encodeJwt({ sub: "user-uuid-from-jwt" }),
    );

    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({ transport, enableInterval: false });
    service.track("user_login_succeeded", {});
    await service.flush();

    const parsed = JSON.parse(String(transport.mock.calls.at(0)?.[1])) as {
      events: Array<{ userId: string }>;
    };
    expect(parsed.events[0]?.userId).toBe("user-uuid-from-jwt");
    service.dispose();
  });

  it("falls back to anonymous when JWT payload is invalid", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    window.localStorage.setItem("nexova_access_token", "not-a-jwt");

    const {
      ANONYMOUS_USER_ID,
      TelemetryService,
      resetTelemetryServiceForTests,
    } = await import("../uis/backoffice/services/telemetry");
    resetTelemetryServiceForTests();

    const service = new TelemetryService({ transport, enableInterval: false });
    service.track("user_login_failed", { failure_reason: "invalid_credentials" });
    await service.flush();

    const parsed = JSON.parse(String(transport.mock.calls.at(0)?.[1])) as {
      events: Array<{ userId: string }>;
    };
    expect(parsed.events[0]?.userId).toBe(ANONYMOUS_USER_ID);
    service.dispose();
  });

  it("reuses sessionId until rotateTelemetrySessionId is called", async () => {
    const {
      getOrCreateSessionId,
      rotateTelemetrySessionId,
      resetTelemetryServiceForTests,
    } = await import("../uis/backoffice/services/telemetry");
    resetTelemetryServiceForTests();

    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    expect(second).toBe(first);

    const rotated = rotateTelemetrySessionId();
    expect(rotated).not.toBe(first);
    expect(getOrCreateSessionId()).toBe(rotated);
  });

  it("does not flush when the queue is empty", async () => {
    const transport = vi.fn<(url: string, body: string) => Promise<boolean>>(
      async () => true,
    );
    const { TelemetryService, resetTelemetryServiceForTests } = await import(
      "../uis/backoffice/services/telemetry"
    );
    resetTelemetryServiceForTests();

    const service = new TelemetryService({ transport, enableInterval: false });
    await service.flush();
    expect(transport).not.toHaveBeenCalled();
    service.dispose();
  });
});
