import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient, ApiRequestError } from "../lib/api";

// Mock auth
vi.mock("../lib/auth", () => ({
  getIdToken: vi.fn(() => "mock-token"),
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("ApiClient", () => {
  const client = new ApiClient("https://api.example.com");

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("get - makes GET request with auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const result = await client.get("/bots");
    expect(result).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/bots",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );
  });

  it("post - sends JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "123" }),
    });

    const result = await client.post("/bots", { botName: "Test" });
    expect(result).toEqual({ id: "123" });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/bots",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ botName: "Test" }),
      })
    );
  });

  it("delete - makes DELETE request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await client.delete("/bots/123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/bots/123",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throws ApiRequestError on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: "NOT_FOUND", message: "Not found" } }),
    });

    await expect(client.get("/bots/999")).rejects.toThrow(ApiRequestError);
  });
});
