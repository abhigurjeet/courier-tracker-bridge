import { BaseCarrier } from '../base';
import { RateRequest, RateResponse } from '../../types/domain';
import { RateRequestSchema } from '../../validation/schemas';
import { CarrierError, ErrorCode } from '../../types/errors';
import { UpsAuthenticator } from '../../auth/ups-auth';
import { TokenCache } from '../../auth/token-cache';
import { UpsMapper } from './mapper';
import { UpsParser } from './parser';
import { UpsRateRequest, UpsRateResponse } from './types';
const axios = require("axios");
import axiosType from 'axios';

export interface UpsCarrierConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  version?: string;
  requestOption?: string;
}

export class UpsCarrier extends BaseCarrier {
  private authenticator: UpsAuthenticator;
  private axiosInstance;

  constructor(
    private readonly config: UpsCarrierConfig,
    private readonly tokenCache: TokenCache,
    timeoutMs: number = 30000
  ) {
    super();
    this.axiosInstance = axios.create({
      timeout: timeoutMs
    });
    this.authenticator = new UpsAuthenticator(
      {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authUrl: config.authUrl
      },
      tokenCache,
      timeoutMs
    );
  }

  getName(): string {
    return 'UPS';
  }

  async getRates(request: RateRequest): Promise<RateResponse> {
    try {
      RateRequestSchema.parse(request);
    } catch (error) {
      throw new CarrierError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid rate request',
        { validationError: error instanceof Error ? error.message : String(error) }
      );
    }

    let accessToken: string;
    try {
      accessToken = await this.authenticator.getAccessToken();
    } catch (error) {
      if (error instanceof CarrierError) {
        throw error;
      }
      throw new CarrierError(
        ErrorCode.AUTH_FAILED,
        'Failed to authenticate with UPS',
        {},
        error instanceof Error ? error : new Error(String(error))
      );
    }

    const upsRequest = UpsMapper.toUpsRateRequest(request);

    try {
      const version = this.config.version || 'v2409';
      const requestOption = this.config.requestOption || 'Rate';
      const url = `${this.config.baseUrl}/api/rating/${version}/${requestOption}`;
      
      const response = await this.axiosInstance.post(
        url,
        upsRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'transId': this.generateTransactionId(),
            'transactionSrc': 'Cybership',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return UpsParser.parseRateResponse(response.data as UpsRateResponse | any);
    } catch (error: any) {
      if (axiosType.isAxiosError && axiosType.isAxiosError(error)) {
        const status = error.response?.status;
        
        if (status === 401) {
          await this.tokenCache.clear();
          try {
            accessToken = await this.authenticator.getAccessToken();
            const url = `${this.config.baseUrl}/api/rating/v1/Rate`;
            const version = this.config.version || 'v2409';
            const requestOption = this.config.requestOption || 'Rate';
            const retryUrl = `${this.config.baseUrl}/api/rating/${version}/${requestOption}`;
            
            const response = await this.axiosInstance.post(
              retryUrl,
              upsRequest,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'transId': this.generateTransactionId(),
                  'transactionSrc': 'Cybership',
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            );
            return UpsParser.parseRateResponse(response.data as UpsRateResponse | any);
          } catch (retryError: any) {
            throw new CarrierError(
              ErrorCode.AUTH_FAILED,
              'UPS authentication failed after retry',
              {},
              retryError instanceof Error ? retryError : new Error(String(retryError))
            );
          }
        }

        if (status === 429) {
          throw new CarrierError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            'UPS rate limit exceeded',
            {},
            error
          );
        }

        if (status && status >= 400 && status < 500) {
          throw new CarrierError(
            ErrorCode.API_ERROR,
            `UPS API error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
            {},
            error
          );
        }

        if (status && status >= 500) {
          throw new CarrierError(
            ErrorCode.API_ERROR,
            `UPS server error: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
            {},
            error
          );
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new CarrierError(
            ErrorCode.TIMEOUT,
            `Request timeout: ${error.message}`,
            {},
            error
          );
        }
      }

      if (error instanceof CarrierError) {
        throw error;
      }

      this.handleError(error, 'UPS getRates');
    }
  }

  private generateTransactionId(): string {
    return `cybership-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
