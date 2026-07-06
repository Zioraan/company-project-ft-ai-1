import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  PlatformApiError,
  parseErrorMessage,
  platformApiRequest,
} from "../uis/backoffice/lib/platform-api-client";

describe("platform-api-client", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
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
      },
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws network error when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(platformApiRequest("/health")).rejects.toMatchObject({
      message: NETWORK_ERROR_MESSAGE,
      status: 0,
    });
  });

  it("returns generic message for 500 responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "DB exploded" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(platformApiRequest("/auth/me")).rejects.toMatchObject({
      message: GENERIC_ERROR_MESSAGE,
      status: 500,
    });
  });

  it("preserves validation detail for 422 responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: [{ loc: ["body", "email"], msg: "Invalid email" }],
        }),
        {
          status: 422,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    try {
      await platformApiRequest("/auth/register", {
        method: "POST",
        body: "{}",
      });
      expect.fail("Expected request to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PlatformApiError);
      expect((error as PlatformApiError).message).toContain("email");
    }
  });

  it("parseErrorMessage maps 404 to stable copy", () => {
    const response = new Response(null, { status: 404 });
    expect(parseErrorMessage(response, {})).toBe(
      "The requested resource was not found.",
    );
  });
});
