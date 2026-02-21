import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getLoginUrl,
  getLogoutUrl,
  saveTokens,
  getTokens,
  getIdToken,
  clearTokens,
  isAuthenticated,
} from "../lib/auth";

// Mock constants
vi.mock("../lib/constants", () => ({
  COGNITO_CONFIG: {
    USER_POOL_ID: "ap-northeast-1_test",
    CLIENT_ID: "test-client-id",
    DOMAIN: "test.auth.ap-northeast-1.amazoncognito.com",
    REDIRECT_URI: "http://localhost:3000/auth/callback",
    LOGOUT_URI: "http://localhost:3000/",
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("auth", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("getLoginUrl", () => {
    it("returns Cognito Hosted UI URL with correct params", () => {
      const url = getLoginUrl();
      expect(url).toContain("test.auth.ap-northeast-1.amazoncognito.com");
      expect(url).toContain("response_type=code");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("identity_provider=Google");
    });
  });

  describe("getLogoutUrl", () => {
    it("returns Cognito logout URL", () => {
      const url = getLogoutUrl();
      expect(url).toContain("/logout");
      expect(url).toContain("client_id=test-client-id");
    });
  });

  describe("token management", () => {
    const mockTokens = {
      idToken: "id-token-123",
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
      expiresAt: Date.now() + 3600 * 1000,
    };

    it("saveTokens + getTokens round-trip", () => {
      saveTokens(mockTokens);
      const retrieved = getTokens();
      expect(retrieved).toEqual(mockTokens);
    });

    it("getTokens returns null when no tokens stored", () => {
      expect(getTokens()).toBeNull();
    });

    it("getIdToken returns token when valid", () => {
      saveTokens(mockTokens);
      expect(getIdToken()).toBe("id-token-123");
    });

    it("getIdToken returns null when expired", () => {
      saveTokens({ ...mockTokens, expiresAt: Date.now() - 1000 });
      expect(getIdToken()).toBeNull();
    });

    it("clearTokens removes stored tokens", () => {
      saveTokens(mockTokens);
      clearTokens();
      expect(getTokens()).toBeNull();
    });

    it("isAuthenticated returns true when token is valid", () => {
      saveTokens(mockTokens);
      expect(isAuthenticated()).toBe(true);
    });

    it("isAuthenticated returns false when no token", () => {
      expect(isAuthenticated()).toBe(false);
    });
  });
});
