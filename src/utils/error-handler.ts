import { ErrorCode } from '../types/errors';

export function getStatusCodeForError(code: ErrorCode | string): number {
  const statusMap: Record<string, number> = {
    [ErrorCode.AUTH_FAILED]: 401,
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
    [ErrorCode.AUTH_TOKEN_INVALID]: 401,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_ADDRESS]: 400,
    [ErrorCode.INVALID_PACKAGE]: 400,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.TIMEOUT]: 504,
    [ErrorCode.NETWORK_ERROR]: 502,
    [ErrorCode.CONNECTION_ERROR]: 502,
    [ErrorCode.API_ERROR]: 502,
    [ErrorCode.MALFORMED_RESPONSE]: 502,
    [ErrorCode.CONFIG_ERROR]: 500,
    [ErrorCode.UNKNOWN_ERROR]: 500
  };

  return statusMap[code] || 500;
}
