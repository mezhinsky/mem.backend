import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { COOKIE_NAMES } from '../auth.constants';

/**
 * CSRF Guard using Double Submit Cookie pattern
 *
 * This guard validates that:
 * 1. The csrf_token cookie exists
 * 2. The X-CSRF-Token header exists
 * 3. Both values match
 *
 * This works because:
 * - An attacker cannot read the csrf_token cookie from another domain (Same-Origin Policy)
 * - An attacker cannot set custom headers via cross-origin requests without CORS preflight
 * - The legitimate frontend can read the cookie (HttpOnly=false) and send it as a header
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Get CSRF token from cookie
    const cookieToken = request.cookies?.[COOKIE_NAMES.CSRF_TOKEN];

    // Get CSRF token from header
    const headerToken = request.headers['x-csrf-token'];

    // Both must exist
    if (!cookieToken) {
      throw new ForbiddenException('CSRF token cookie missing');
    }

    if (!headerToken) {
      throw new ForbiddenException('X-CSRF-Token header missing');
    }

    // Normalize header token (could be string or string[])
    const headerTokenValue = Array.isArray(headerToken)
      ? headerToken[0]
      : headerToken;

    // Tokens must match (timing-safe comparison)
    if (!this.timingSafeEqual(cookieToken, headerTokenValue)) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    let result = 0;
    for (let i = 0; i < bufferA.length; i++) {
      result |= bufferA[i] ^ bufferB[i];
    }

    return result === 0;
  }
}
