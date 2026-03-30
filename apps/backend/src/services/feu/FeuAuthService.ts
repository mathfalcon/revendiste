import axios from 'axios';
import { logger } from '~/utils';
import { withRetry } from '~/utils/retry';
import {
  FEU_AUTH_URL,
  FEU_USERNAME,
  FEU_PASSWORD,
  FEU_REFRESH_TOKEN,
  FEU_REQUEST_TIMEOUT_MS,
} from '~/config/env';
import type { FeuTokenResponse } from './types';
import { INVOICE_ERROR_MESSAGES } from '~/constants/error-messages';

const BUFFER_SECONDS = 60;

/** Default when API omits expires_in and token is not a JWT (FEU access tokens are ~1 day). */
const DEFAULT_EXPIRES_IN_SECONDS = 86400;

/** Same endpoint as login; body grant_type=refresh_token + refresh_token */
const REFRESH_GRANT = 'refresh_token';

/**
 * Decode JWT payload without verification (we only need exp for our own refresh logic).
 * Returns seconds until expiry from now, or null if not a JWT or no exp claim.
 */
function getExpiresInSecondsFromJwt(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as { exp?: number };
    if (typeof decoded.exp !== 'number') return null;
    const nowSec = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - nowSec;
    return remaining > 0 ? remaining : 0;
  } catch {
    return null;
  }
}

/**
 * Manages FEU API authentication: access_token (short-lived) and refresh_token (long-lived).
 * Singleton: one instance in process; refresh token from env (FEU_REFRESH_TOKEN) or in-memory after password bootstrap.
 * Use FEU_REFRESH_TOKEN in secrets and rotate once a year; otherwise first login with username/password fills in-memory refresh.
 *
 * Only refreshes when needed: if we have a valid access token (expiration from API expires_in, JWT exp claim, or 1-day default)
 * and it is not within BUFFER_SECONDS of expiry, getAccessToken() returns the cached token without calling the auth API.
 */
export class FeuAuthService {
  private static instance: FeuAuthService | null = null;

  private accessToken: string | null = null;
  private accessTokenExpiresAt: Date | null = null;
  /** In-memory refresh token from password bootstrap; used when FEU_REFRESH_TOKEN is not set */
  private refreshTokenInMemory: string | null = null;

  static getInstance(): FeuAuthService {
    if (!FeuAuthService.instance) {
      FeuAuthService.instance = new FeuAuthService();
    }
    return FeuAuthService.instance;
  }

  /** Use the singleton. Exposed for tests that need a fresh instance. */
  static resetInstance(): void {
    FeuAuthService.instance = null;
  }

  /**
   * Returns a valid access token, refreshing or bootstrapping as needed.
   * Prefers FEU_REFRESH_TOKEN from env; otherwise uses in-memory refresh from password login.
   */
  async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.accessTokenExpiresAt &&
      this.accessTokenExpiresAt > new Date(Date.now() + BUFFER_SECONDS * 1000)
    ) {
      return this.accessToken;
    }

    const refreshToken = FEU_REFRESH_TOKEN ?? this.refreshTokenInMemory;
    if (refreshToken) {
      try {
        await this.refreshAccessToken(refreshToken);
        if (this.accessToken) return this.accessToken;
      } catch (error) {
        logger.warn('FEU refresh token failed, bootstrapping with password', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.bootstrap();
    if (!this.accessToken) {
      throw new Error(INVOICE_ERROR_MESSAGES.FEU_AUTH_FAILED);
    }
    return this.accessToken;
  }

  /**
   * Refresh access token using the same auth endpoint: grant_type=refresh_token, refresh_token=...
   */
  private async refreshAccessToken(refreshToken: string): Promise<void> {
    if (!FEU_AUTH_URL) {
      throw new Error(INVOICE_ERROR_MESSAGES.FEU_AUTH_FAILED);
    }

    const response = await axios.post<FeuTokenResponse>(
      FEU_AUTH_URL,
      { grant_type: REFRESH_GRANT, refresh_token: refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: FEU_REQUEST_TIMEOUT_MS ?? 30_000,
      },
    );

    this.setTokens(response.data);
  }

  /**
   * Bootstrap auth using password grant. Call when no refresh token or refresh failed.
   * Stores returned refresh_token in memory for subsequent refreshes (if FEU_REFRESH_TOKEN not set).
   */
  private async bootstrap(): Promise<void> {
    const authUrl = FEU_AUTH_URL;
    const username = FEU_USERNAME;
    const password = FEU_PASSWORD;
    if (!authUrl || !username || !password) {
      throw new Error(INVOICE_ERROR_MESSAGES.FEU_AUTH_FAILED);
    }

    const response = await withRetry(
      () =>
        axios.post<FeuTokenResponse>(
          authUrl,
          { grant_type: 'password', username, password },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: FEU_REQUEST_TIMEOUT_MS ?? 30_000,
          },
        ),
      { maxAttempts: 2, shouldRetry: err => !axios.isAxiosError(err) || (err.response?.status ?? 0) >= 500 },
    );

    this.setTokens(response.data as FeuTokenResponse);
  }

  private setTokens(data: FeuTokenResponse): void {
    this.accessToken = data.access_token;
    this.refreshTokenInMemory = data.refresh_token;
    const expiresIn =
      data.expires_in ??
      getExpiresInSecondsFromJwt(data.access_token) ??
      DEFAULT_EXPIRES_IN_SECONDS;
    this.accessTokenExpiresAt = new Date(
      Date.now() + (expiresIn - BUFFER_SECONDS) * 1000,
    );
  }
}

/** Singleton getter for FEU auth; use this instead of `new FeuAuthService()`. */
export function getFeuAuthService(): FeuAuthService {
  return FeuAuthService.getInstance();
}
