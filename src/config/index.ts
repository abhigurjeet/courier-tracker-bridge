export interface Config {
  ups: {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    authUrl: string;
    version?: string;
    requestOption?: string;
  };
  http: {
    timeoutMs: number;
    retryAttempts: number;
  };
  tokenCache: {
    ttlSeconds: number;
  };
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value || defaultValue!;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

export function loadConfig(): Config {
  return {
    ups: {
      clientId: getEnvVar('UPS_CLIENT_ID'),
      clientSecret: getEnvVar('UPS_CLIENT_SECRET'),
      baseUrl: getEnvVar('UPS_BASE_URL', 'https://wwwcie.ups.com'),
      authUrl: getEnvVar('UPS_AUTH_URL', 'https://onlinetools.ups.com/security/v1/oauth/token'),
      version: getEnvVar('UPS_API_VERSION', 'v2409'),
      requestOption: getEnvVar('UPS_REQUEST_OPTION', 'Rate')
    },
    http: {
      timeoutMs: getEnvNumber('HTTP_TIMEOUT_MS', 30000),
      retryAttempts: getEnvNumber('HTTP_RETRY_ATTEMPTS', 3)
    },
    tokenCache: {
      ttlSeconds: getEnvNumber('TOKEN_CACHE_TTL_SECONDS', 3600)
    }
  };
}
