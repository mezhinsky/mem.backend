import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEYS, TTL } from '../auth.constants';

@Injectable()
export class RedisSessionService {
  private readonly logger = new Logger(RedisSessionService.name);

  constructor(private redisService: RedisService) {}

  /**
   * Generate a new session ID (UUID v4)
   */
  generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Generate a cryptographically secure refresh token
   */
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Generate a CSRF token
   */
  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Store refresh token for a session
   * Key: session:<userId>:<sessionId> -> refreshToken
   */
  async storeSession(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<void> {
    const key = REDIS_KEYS.session(userId, sessionId);
    await this.redisService.set(key, refreshToken, TTL.REFRESH_TOKEN_SECONDS);
    this.logger.debug(
      `Stored session for user ${userId}, session ${sessionId.substring(0, 8)}...`,
    );
  }

  /**
   * Get refresh token for a session
   */
  async getSessionRefreshToken(
    userId: string,
    sessionId: string,
  ): Promise<string | null> {
    const key = REDIS_KEYS.session(userId, sessionId);
    return this.redisService.get(key);
  }

  /**
   * Validate that a refresh token matches the stored session
   */
  async validateSession(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const storedToken = await this.getSessionRefreshToken(userId, sessionId);

    if (!storedToken) {
      this.logger.debug(
        `Session not found: user ${userId}, session ${sessionId.substring(0, 8)}...`,
      );
      return false;
    }

    // Use timing-safe comparison
    if (storedToken.length !== refreshToken.length) {
      return false;
    }

    const storedBuffer = Buffer.from(storedToken);
    const providedBuffer = Buffer.from(refreshToken);

    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < storedBuffer.length; i++) {
      result |= storedBuffer[i] ^ providedBuffer[i];
    }

    return result === 0;
  }

  /**
   * Delete a specific session
   */
  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const key = REDIS_KEYS.session(userId, sessionId);
    const deleted = await this.redisService.del(key);
    this.logger.debug(
      `Deleted session for user ${userId}, session ${sessionId.substring(0, 8)}...`,
    );
    return deleted > 0;
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    const pattern = REDIS_KEYS.userSessions(userId);
    const deleted = await this.redisService.delByPattern(pattern);
    this.logger.debug(
      `Deleted ${deleted} sessions for user ${userId}`,
    );
    return deleted;
  }

  /**
   * Refresh session TTL (extend expiration)
   * Optionally rotate refresh token
   */
  async refreshSession(
    userId: string,
    sessionId: string,
    newRefreshToken?: string,
  ): Promise<string> {
    const token = newRefreshToken || this.generateRefreshToken();
    await this.storeSession(userId, sessionId, token);
    return token;
  }
}
