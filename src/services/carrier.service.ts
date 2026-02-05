import { UpsCarrier } from '../carriers/ups/ups-carrier';
import { MemoryTokenCache } from '../auth/token-cache';
import { loadConfig } from '../config';
import { RateRequest, RateResponse } from '../types/domain';

export class CarrierService {
  private upsCarrier: UpsCarrier;

  constructor() {
    const config = loadConfig();
    const tokenCache = new MemoryTokenCache();

    this.upsCarrier = new UpsCarrier(
      {
        baseUrl: config.ups.baseUrl,
        clientId: config.ups.clientId,
        clientSecret: config.ups.clientSecret,
        authUrl: config.ups.authUrl,
        version: config.ups.version,
        requestOption: config.ups.requestOption
      },
      tokenCache,
      30000
    );
  }

  async getRates(request: RateRequest): Promise<RateResponse> {
    return this.upsCarrier.getRates(request);
  }

  getAvailableCarriers(): string[] {
    return ['UPS'];
  }
}
