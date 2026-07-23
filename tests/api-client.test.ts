import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  ApiError,
  apiRequest,
} from "../uis/backoffice/lib/api-client";

describe("api-client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws network error when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiRequest("/records")).rejects.toMatchObject({
      message: NETWORK_ERROR_MESSAGE,
      status: 0,
    });
  });

  it("returns generic message for upstream 500 responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "internal trace" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(apiRequest("/records")).rejects.toMatchObject({
      message: GENERIC_ERROR_MESSAGE,
      status: 500,
    });
  });

  it("surfaces safe 4xx error messages from payload", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(apiRequest("/records/1")).rejects.toMatchObject({
      message: "Record not found",
      status: 404,
    } satisfies Partial<ApiError>);
  });
});
