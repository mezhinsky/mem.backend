// Redis key prefixes and TTLs
export const REDIS_KEYS = {
  // OAuth state key: oauth_state:<state> -> "1"
  oauthState: (state: string) => `oauth_state:${state}`,

  // Session key: session:<userId>:<sessionId> -> refreshToken
  session: (userId: string, sessionId: string) =>
    `session:${userId}:${sessionId}`,

  // Pattern for all user sessions
  userSessions: (userId: string) => `session:${userId}:*`,
} as const;

export const TTL = {
  // OAuth state TTL: 10 minutes
  OAUTH_STATE_SECONDS: 10 * 60,

  // Refresh token TTL: 7 days
  REFRESH_TOKEN_SECONDS: 7 * 24 * 60 * 60,

  // Access token TTL: 15 minutes
  ACCESS_TOKEN_SECONDS: 15 * 60,
} as const;

// Cookie names
export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
} as const;

// Google OAuth endpoints
export const GOOGLE_OAUTH = {
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  USERINFO_URL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  SCOPES: ['openid', 'email', 'profile'],
} as const;
