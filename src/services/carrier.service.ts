import { Carrier } from '../carriers/base';
import { UpsCarrier } from '../carriers/ups/ups-carrier';
import { MemoryTokenCache } from '../auth/token-cache';
import { loadConfig } from '../config';
import { RateRequest, RateResponse } from '../types/domain';
import { CarrierError, ErrorCode } from '../types/errors';

export class CarrierService {
  private carriers: Map<string, Carrier> = new Map();

  constructor() {
    const config = loadConfig();
    const tokenCache = new MemoryTokenCache();

    if (config.carriers.UPS) {
      const upsConfig = config.carriers.UPS;
      this.carriers.set('UPS', new UpsCarrier(
        {
          baseUrl: upsConfig.baseUrl,
          clientId: upsConfig.clientId,
          clientSecret: upsConfig.clientSecret,
          authUrl: upsConfig.authUrl,
          version: upsConfig.version,
          requestOption: upsConfig.requestOption
        },
        tokenCache,
        30000
      ));
    }
  }

  async getRates(carrierName: string, request: RateRequest): Promise<RateResponse> {
    const normalizedName = carrierName.toUpperCase();
    const carrier = this.carriers.get(normalizedName);
    if (!carrier) {
      const available = this.getAvailableCarriers();
      const message = available.length === 0
        ? `No carriers are configured. Please configure at least one carrier in your environment variables.`
        : `Carrier ${carrierName} is not available. Available carriers: ${available.join(', ')}`;
      throw new CarrierError(ErrorCode.API_ERROR, message);
    }
    return carrier.getRates(request);
  }

  getAvailableCarriers(): string[] {
    return Array.from(this.carriers.keys());
  }
}
