import { COGNITO_CONFIG } from "./constants";

const TOKEN_KEY = "colon_tokens";

interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Build the redirect URI for the given locale
 */
function getRedirectUri(locale: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/${locale}/auth/callback`;
  }
  return COGNITO_CONFIG.REDIRECT_URI;
}

/**
 * Get the Cognito Hosted UI login URL
 */
export function getLoginUrl(locale: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: COGNITO_CONFIG.CLIENT_ID,
    redirect_uri: getRedirectUri(locale),
    scope: "openid email profile",
    identity_provider: "Google",
  });
  return `https://${COGNITO_CONFIG.DOMAIN}/oauth2/authorize?${params}`;
}

/**
 * Get the Cognito logout URL
 */
export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: COGNITO_CONFIG.CLIENT_ID,
    logout_uri: COGNITO_CONFIG.LOGOUT_URI,
  });
  return `https://${COGNITO_CONFIG.DOMAIN}/logout?${params}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, locale: string): Promise<AuthTokens> {
  const response = await fetch(
    `https://${COGNITO_CONFIG.DOMAIN}/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: COGNITO_CONFIG.CLIENT_ID,
        code,
        redirect_uri: getRedirectUri(locale),
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  const data = await response.json();
  const tokens: AuthTokens = {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveTokens(tokens);
  return tokens;
}

/**
 * Save tokens to localStorage
 */
export function saveTokens(tokens: AuthTokens): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  }
}

/**
 * Get stored tokens
 */
export function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthTokens;
  } catch {
    return null;
  }
}

/**
 * Get the ID token for API requests
 */
export function getIdToken(): string | null {
  const tokens = getTokens();
  if (!tokens) return null;

  // Check if token is expired
  if (Date.now() > tokens.expiresAt) {
    clearTokens();
    return null;
  }

  return tokens.idToken;
}

/**
 * Clear stored tokens (logout)
 */
export function clearTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getIdToken() !== null;
}
