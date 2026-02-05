import { RateRequest, RateResponse } from '../types/domain';
import { CarrierError, ErrorCode } from '../types/errors';

export interface Carrier {
  getRates(request: RateRequest): Promise<RateResponse>;
  getName(): string;
}

export abstract class BaseCarrier implements Carrier {
  abstract getName(): string;
  abstract getRates(request: RateRequest): Promise<RateResponse>;

  protected validateRequest(request: RateRequest): void {
  }

  protected handleError(error: unknown, context?: string): never {
    if (error instanceof CarrierError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new CarrierError(
          ErrorCode.TIMEOUT,
          `Request timeout: ${error.message}`,
          { context },
          error
        );
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new CarrierError(
          ErrorCode.NETWORK_ERROR,
          `Network error: ${error.message}`,
          { context },
          error
        );
      }

      throw new CarrierError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        { context },
        error
      );
    }

    throw new CarrierError(
      'UNKNOWN_ERROR' as any,
      'An unknown error occurred',
      { context, error: String(error) }
    );
  }
}
