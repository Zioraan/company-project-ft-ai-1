import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createLocalStorageMock() {
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

describe("platform-api-client", () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal("window", { localStorage, location: { href: "" } });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("attaches bearer token when authenticated", async () => {
    const { setAccessToken } = await import("../uis/backoffice/lib/auth-token");
    const { platformApiRequest } = await import(
      "../uis/backoffice/lib/platform-api-client"
    );

    setAccessToken("abc123");
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await platformApiRequest("/auth/me");

    expect(fetchMock).toHaveBeenCalledOnce();
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const init = firstCall?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer abc123");
  });

  it("clears token and redirects on 401 for authenticated requests", async () => {
    const { setAccessToken, getAccessToken } = await import(
      "../uis/backoffice/lib/auth-token"
    );
    const { platformApiRequest } = await import(
      "../uis/backoffice/lib/platform-api-client"
    );

    setAccessToken("abc123");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(platformApiRequest("/auth/me")).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("does not redirect on 401 for public requests", async () => {
    const { platformApiRequest } = await import(
      "../uis/backoffice/lib/platform-api-client"
    );

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      platformApiRequest(
        "/auth/login",
        { method: "POST", body: "{}" },
        { public: true },
      ),
    ).rejects.toThrow();
    expect(window.location.href).toBe("");
  });
});
