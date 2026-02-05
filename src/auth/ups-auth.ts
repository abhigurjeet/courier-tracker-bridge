const axios = require("axios");
import axiosType from 'axios';
import { TokenCache } from './token-cache';
import { CarrierError, ErrorCode } from '../types/errors';

export interface UpsAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
}

export interface UpsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class UpsAuthenticator {
  private axiosInstance;

  constructor(
    private readonly config: UpsAuthConfig,
    private readonly tokenCache: TokenCache,
    timeoutMs: number = 30000
  ) {
    this.axiosInstance = axios.create({
      timeout: timeoutMs
    });
  }

  async getAccessToken(): Promise<string> {
    const cachedToken = await this.tokenCache.get();
    if (cachedToken) {
      return cachedToken;
    }

    return this.acquireToken();
  }

  private async acquireToken(): Promise<string> {
    try {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await this.axiosInstance.post(
        this.config.authUrl,
        new URLSearchParams({
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (!response.data.access_token) {
        throw new CarrierError(
          ErrorCode.AUTH_FAILED,
          'Invalid token response from UPS: missing access_token'
        );
      }

      await this.tokenCache.set(
        response.data.access_token,
        response.data.expires_in || 3600
      );

      return response.data.access_token;
    } catch (error: any) {
      if (error instanceof CarrierError) {
        throw error;
      }

      if (axiosType.isAxiosError && axiosType.isAxiosError(error)) {
        const status = error.response?.status;
        
        if (status === 401) {
          throw new CarrierError(
            ErrorCode.AUTH_FAILED,
            'UPS authentication failed: invalid credentials',
            {},
            error
          );
        }

        if (status === 429) {
          throw new CarrierError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            'UPS rate limit exceeded during authentication',
            {},
            error
          );
        }
      }

      throw new CarrierError(
        ErrorCode.AUTH_FAILED,
        'Failed to acquire UPS access token',
        {},
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
