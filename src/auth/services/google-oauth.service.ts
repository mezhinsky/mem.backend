import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS, TTL, GOOGLE_OAUTH } from '../auth.constants';

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

export interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    this.redirectUri = this.configService.getOrThrow<string>(
      'GOOGLE_REDIRECT_URI',
    );
  }

  /**
   * Generate a cryptographically secure state parameter
   * and store it in Redis with TTL
   */
  async generateState(): Promise<string> {
    const state = randomBytes(32).toString('hex');
    const key = REDIS_KEYS.oauthState(state);

    await this.redisService.set(key, '1', TTL.OAUTH_STATE_SECONDS);
    this.logger.debug(`Generated OAuth state: ${state.substring(0, 8)}...`);

    return state;
  }

  /**
   * Validate state parameter by checking Redis and deleting it (one-time use)
   */
  async validateState(state: string): Promise<boolean> {
    const key = REDIS_KEYS.oauthState(state);
    const exists = await this.redisService.get(key);

    if (!exists) {
      this.logger.warn(
        `Invalid or expired OAuth state: ${state.substring(0, 8)}...`,
      );
      return false;
    }

    // Delete state to prevent replay attacks (one-time use)
    await this.redisService.del(key);
    return true;
  }

  /**
   * Build Google OAuth authorization URL
   */
  buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: GOOGLE_OAUTH.SCOPES.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${GOOGLE_OAUTH.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_OAUTH.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to exchange code for tokens: ${error}`);
      throw new UnauthorizedException('Failed to exchange code for tokens');
    }

    const data: GoogleTokenResponse = await response.json();
    return data;
  }

  /**
   * Fetch user profile from Google using access token
   */
  async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(GOOGLE_OAUTH.USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to fetch user info: ${error}`);
      throw new UnauthorizedException('Failed to fetch user info from Google');
    }

    const userInfo: GoogleUserInfo = await response.json();
    return userInfo;
  }
}
