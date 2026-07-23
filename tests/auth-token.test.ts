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

describe("auth-token", () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores and retrieves access token", async () => {
    const { clearAccessToken, getAccessToken, isAuthenticated, setAccessToken } =
      await import("../uis/backoffice/lib/auth-token");

    setAccessToken("test-token");
    expect(getAccessToken()).toBe("test-token");
    expect(isAuthenticated()).toBe(true);
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
