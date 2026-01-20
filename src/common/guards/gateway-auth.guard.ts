import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// User info from Gateway headers
export interface GatewayUser {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: GatewayUser;
    }
  }
}

/**
 * Gateway authentication guard that reads user info from Gateway headers.
 *
 * In production, requests come through mez.gateway which:
 * 1. Validates JWT token
 * 2. Fetches user info from mez.auth
 * 3. Adds x-user-* headers to the request
 *
 * For local development, set SKIP_AUTH=true in .env
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly skipAuth: boolean;

  constructor(private configService: ConfigService) {
    this.skipAuth = this.configService.get<string>('SKIP_AUTH') === 'true';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip auth for local development
    if (this.skipAuth) {
      request.user = {
        id: 'dev-user',
        role: 'ADMIN',
        email: 'dev@localhost',
        name: 'Development User',
      };
      return true;
    }

    // Extract user info from Gateway headers
    const userId = request.headers['x-user-id'] as string;
    const userRole = request.headers['x-user-role'] as string;
    const userEmail = request.headers['x-user-email'] as string;
    const userName = request.headers['x-user-name'] as string;

    // If no user headers, request didn't come through Gateway
    if (!userId) {
      throw new UnauthorizedException(
        'Missing authentication headers. Requests must go through Gateway.',
      );
    }

    // Attach user to request
    request.user = {
      id: userId,
      role: userRole,
      email: userEmail || undefined,
      name: userName || undefined,
    };

    return true;
  }
}
