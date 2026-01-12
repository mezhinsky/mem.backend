import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleOAuthService, GoogleUserInfo } from './google-oauth.service';
import { RedisSessionService } from './redis-session.service';
import { TTL } from '../auth.constants';

export interface JwtPayload {
  sub: string; // userId
  email?: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private googleOAuthService: GoogleOAuthService,
    private redisSessionService: RedisSessionService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  /**
   * Initiate Google OAuth flow - returns authorization URL
   */
  async initiateGoogleAuth(): Promise<string> {
    const state = await this.googleOAuthService.generateState();
    return this.googleOAuthService.buildAuthorizationUrl(state);
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string, state: string): Promise<AuthResult> {
    // Validate state parameter
    const isValidState = await this.googleOAuthService.validateState(state);
    if (!isValidState) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    // Exchange code for tokens
    const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);

    // Fetch user info from Google
    const googleUser = await this.googleOAuthService.fetchUserInfo(
      tokens.access_token,
    );

    // Create or update user in database
    const user = await this.upsertUser(googleUser);

    // Generate session
    const sessionId = this.redisSessionService.generateSessionId();
    const refreshToken = this.redisSessionService.generateRefreshToken();

    // Store session in Redis
    await this.redisSessionService.storeSession(
      user.id,
      sessionId,
      refreshToken,
    );

    // Generate access token
    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    });

    this.logger.log(`User ${user.id} authenticated via Google OAuth`);

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Create or update user based on Google profile
   */
  private async upsertUser(googleUser: GoogleUserInfo) {
    return this.prisma.user.upsert({
      where: { googleSub: googleUser.sub },
      update: {
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      },
      create: {
        googleSub: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      },
    });
  }

  /**
   * Generate access token (JWT)
   */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: TTL.ACCESS_TOKEN_SECONDS,
    });
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Validate session refresh token from Redis
   */
  async validateSessionRefreshToken(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<boolean> {
    return this.redisSessionService.validateSession(
      userId,
      sessionId,
      refreshToken,
    );
  }

  /**
   * Refresh access token using refresh token from cookie
   */
  async refreshAccessToken(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<string> {
    // Validate refresh token
    const isValid = await this.validateSessionRefreshToken(
      userId,
      sessionId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user from database to include latest info in token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    return this.generateAccessToken({
      sub: user.id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    });
  }

  /**
   * Logout from specific session
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    await this.redisSessionService.deleteSession(userId, sessionId);
    this.logger.log(
      `User ${userId} logged out from session ${sessionId.substring(0, 8)}...`,
    );
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(userId: string): Promise<number> {
    const count = await this.redisSessionService.deleteAllUserSessions(userId);
    this.logger.log(`User ${userId} logged out from ${count} sessions`);
    return count;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Generate CSRF token
   */
  generateCsrfToken(): string {
    return this.redisSessionService.generateCsrfToken();
  }
}
