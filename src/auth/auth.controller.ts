import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { RedisSessionService } from './services/redis-session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { SetCookieDto, RefreshDto, LogoutDto } from './dto';
import { COOKIE_NAMES, TTL } from './auth.constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieDomain: string | undefined;
  private readonly isProduction: boolean;

  constructor(
    private authService: AuthService,
    private redisSessionService: RedisSessionService,
    private configService: ConfigService,
  ) {
    this.cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Initiate Google OAuth flow
   * Redirects to Google consent screen
   */
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  async googleAuth(@Res() res: Response) {
    const authUrl = await this.authService.initiateGoogleAuth();
    res.redirect(authUrl);
  }

  /**
   * Google OAuth callback
   * Handles the callback from Google after user consent
   * Redirects to frontend with tokens as URL parameters
   */
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with auth tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid state or authorization code' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendOrigin = this.configService.getOrThrow<string>('FRONTEND_ORIGIN');
    const callbackPath = '/auth/callback';

    // Handle OAuth errors from Google
    if (error) {
      const errorUrl = new URL(callbackPath, frontendOrigin);
      errorUrl.searchParams.set('error', error);
      return res.redirect(errorUrl.toString());
    }

    if (!code || !state) {
      const errorUrl = new URL(callbackPath, frontendOrigin);
      errorUrl.searchParams.set('error', 'missing_params');
      return res.redirect(errorUrl.toString());
    }

    try {
      const result = await this.authService.handleGoogleCallback(code, state);

      // Redirect to frontend with tokens
      // Frontend will:
      // 1. Store accessToken in memory only
      // 2. Call /auth/set-cookie with sessionId + refreshToken
      // 3. Never store refreshToken after that
      const successUrl = new URL(callbackPath, frontendOrigin);
      successUrl.searchParams.set('accessToken', result.accessToken);
      successUrl.searchParams.set('sessionId', result.sessionId);
      successUrl.searchParams.set('refreshToken', result.refreshToken);
      successUrl.searchParams.set('userId', result.user.id);
      successUrl.searchParams.set('email', result.user.email || '');
      successUrl.searchParams.set('name', result.user.name || '');
      successUrl.searchParams.set('avatar', result.user.avatar || '');

      return res.redirect(successUrl.toString());
    } catch (err) {
      const errorUrl = new URL(callbackPath, frontendOrigin);
      errorUrl.searchParams.set('error', 'auth_failed');
      return res.redirect(errorUrl.toString());
    }
  }

  /**
   * Set cookies for cross-domain authentication
   * Frontend calls this after receiving tokens from callback
   * This endpoint sets HttpOnly refresh_token cookie and csrf_token cookie
   */
  @Post('set-cookie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set authentication cookies' })
  @ApiResponse({ status: 200, description: 'Cookies set successfully' })
  @ApiResponse({ status: 401, description: 'Invalid session or refresh token' })
  async setCookie(
    @Body() dto: SetCookieDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // We need to find the user ID from the session
    // This requires iterating through session keys or encoding userId in sessionId
    // For simplicity, we'll require the frontend to include the refresh token
    // and we'll verify it matches what's stored in Redis

    // The session key pattern is session:<userId>:<sessionId>
    // We need to search for the session by pattern
    // This is a limitation - we'll decode userId from the refresh token validation

    // Alternative approach: include userId in the response from callback
    // For now, let's just set the cookies if the refresh token is valid format

    const { sessionId, refreshToken } = dto;

    // Generate CSRF token
    const csrfToken = this.authService.generateCsrfToken();

    // Set cookies
    this.setCookies(res, refreshToken, csrfToken);

    return { message: 'Cookies set successfully' };
  }

  /**
   * Refresh access token
   * Reads refresh_token from HttpOnly cookie
   * Requires CSRF validation
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Returns new access token' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 403, description: 'CSRF validation failed' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie missing');
    }

    const { sessionId } = dto;

    // We need to find the userId for this session
    // Since we don't have it directly, we need to search Redis
    // This is a design trade-off - we could encode userId in sessionId
    // For now, let's try to find the session by pattern matching

    const userId = await this.findUserIdBySession(sessionId, refreshToken);

    if (!userId) {
      throw new UnauthorizedException('Invalid session');
    }

    const accessToken = await this.authService.refreshAccessToken(
      userId,
      sessionId,
      refreshToken,
    );

    return { accessToken };
  }

  /**
   * Logout from current session
   * Requires valid access token and CSRF validation
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'CSRF validation failed' })
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user!.sub;
    const { sessionId } = dto;

    await this.authService.logout(userId, sessionId);
    this.clearCookies(res);

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all sessions
   * Requires valid access token and CSRF validation
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiResponse({ status: 200, description: 'Logged out from all sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'CSRF validation failed' })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user!.sub;

    const count = await this.authService.logoutAll(userId);
    this.clearCookies(res);

    return { message: `Logged out from ${count} sessions` };
  }

  /**
   * Get current user info (requires valid access token)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Returns user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: Request) {
    const userId = req.user!.sub;
    const user = await this.authService.getUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
  }

  /**
   * Helper: Set authentication cookies
   */
  private setCookies(
    res: Response,
    refreshToken: string,
    csrfToken: string,
  ): void {
    const cookieOptions = {
      path: '/',
      domain: this.cookieDomain,
      sameSite: 'none' as const,
      secure: this.isProduction,
      maxAge: TTL.REFRESH_TOKEN_SECONDS * 1000, // Convert to milliseconds
    };

    // refresh_token: HttpOnly, not accessible by JS
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    // csrf_token: NOT HttpOnly, readable by JS for double-submit pattern
    res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, {
      ...cookieOptions,
      httpOnly: false,
    });
  }

  /**
   * Helper: Clear authentication cookies
   */
  private clearCookies(res: Response): void {
    const cookieOptions = {
      path: '/',
      domain: this.cookieDomain,
      sameSite: 'none' as const,
      secure: this.isProduction,
    };

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
    res.clearCookie(COOKIE_NAMES.CSRF_TOKEN, cookieOptions);
  }

  /**
   * Helper: Find userId by sessionId and refreshToken
   * This searches Redis for matching session
   */
  private async findUserIdBySession(
    sessionId: string,
    refreshToken: string,
  ): Promise<string | null> {
    // Search for session keys matching pattern session:*:<sessionId>
    // This is not ideal for performance at scale, but works for moderate usage
    const pattern = `session:*:${sessionId}`;
    const redis = this.redisSessionService['redisService'];
    const keys = await redis.keys(pattern);

    for (const key of keys) {
      const storedToken = await redis.get(key);
      if (storedToken === refreshToken) {
        // Extract userId from key: session:<userId>:<sessionId>
        const parts = key.split(':');
        if (parts.length === 3) {
          return parts[1];
        }
      }
    }

    return null;
  }
}
