const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
import { UpsCarrier } from './ups-carrier';
import { MemoryTokenCache } from '../../auth/token-cache';
import { RateRequest, Address, Package } from '../../types/domain';
import { UpsRateResponse } from './types';
import { CarrierError, ErrorCode } from '../../types/errors';

describe('UpsCarrier Integration Tests', () => {
  let carrier: UpsCarrier;
  let mockAdapter: any;
  let tokenCache: MemoryTokenCache;

  const testConfig = {
    baseUrl: 'https://wwwcie.ups.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authUrl: 'https://onlinetools.ups.com/security/v1/oauth/token',
    version: 'v2409',
    requestOption: 'Rate'
  };

  const testAddress: Address = {
    street: ['123 Main St'],
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  };

  const testPackage: Package = {
    weight: {
      value: 5,
      unit: 'lbs'
    },
    dimensions: {
      length: 10,
      width: 8,
      height: 6,
      unit: 'in'
    }
  };

  beforeEach(() => {
    mockAdapter = new MockAdapter(axios);
    tokenCache = new MemoryTokenCache();
    carrier = new UpsCarrier(testConfig, tokenCache);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('Authentication', () => {
    it('should acquire and cache token on first request', async () => {
      const authResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const rateResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '1',
              Description: 'Success'
            },
            TransactionReference: {
              CustomerContext: 'test-trans-id'
            }
          },
          RatedShipment: [
            {
              Service: {
                Code: '03',
                Description: 'UPS Ground'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '15.50'
              },
              GuaranteedDelivery: {
                BusinessDaysInTransit: '3'
              }
            }
          ]
        }
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(`${testConfig.baseUrl}/api/rating/${testConfig.version}/${testConfig.requestOption}`).reply(200, rateResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      const result = await carrier.getRates(request);

      expect(result.quotes).toHaveLength(1);
      expect(result.quotes[0].carrier).toBe('UPS');
      expect(result.quotes[0].totalCost.amount).toBe(15.50);
    });

    it('should reuse cached token on subsequent requests', async () => {
      const authResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const rateResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '1',
              Description: 'Success'
            }
          },
          RatedShipment: [
            {
              Service: {
                Code: '03',
                Description: 'UPS Ground'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '15.50'
              }
            }
          ]
        }
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(`${testConfig.baseUrl}/api/rating/${testConfig.version}/${testConfig.requestOption}`).reply(200, rateResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await carrier.getRates(request);
      
      mockAdapter.reset();
      mockAdapter.onPost(`${testConfig.baseUrl}/api/rating/${testConfig.version}/${testConfig.requestOption}`).reply(200, rateResponse);

      await carrier.getRates(request);

      expect(mockAdapter.history.post.filter((req: any) => req.url === testConfig.authUrl).length).toBeLessThanOrEqual(1);
    });

    it('should refresh token on 401 error', async () => {
      const authResponse1 = {
        access_token: 'expired-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const authResponse2 = {
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const rateResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '1',
              Description: 'Success'
            }
          },
          RatedShipment: [
            {
              Service: {
                Code: '03',
                Description: 'UPS Ground'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '15.50'
              }
            }
          ]
        }
      };

      mockAdapter.onPost(testConfig.authUrl).replyOnce(200, authResponse1);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).replyOnce(401, { error: 'Unauthorized' });

      mockAdapter.onPost(testConfig.authUrl).replyOnce(200, authResponse2);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).replyOnce(200, rateResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      const result = await carrier.getRates(request);

      expect(result.quotes).toHaveLength(1);
      
      const authRequests = mockAdapter.history.post.filter((req: any) => req.url === testConfig.authUrl);
      expect(authRequests.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle auth failures', async () => {
      mockAdapter.onPost(testConfig.authUrl).reply(401, {
        error: 'invalid_client',
        error_description: 'Invalid credentials'
      });

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await expect(carrier.getRates(request)).rejects.toThrow(CarrierError);
      await expect(carrier.getRates(request)).rejects.toThrow('UPS authentication failed');
    });
  });

  describe('Request Building', () => {
    it('should build correct UPS request from domain model', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const rateResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '1',
              Description: 'Success'
            }
          },
          RatedShipment: [
            {
              Service: {
                Code: '03',
                Description: 'UPS Ground'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '15.50'
              }
            }
          ]
        }
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(`${testConfig.baseUrl}/api/rating/${testConfig.version}/${testConfig.requestOption}`).reply(200, rateResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: {
          street: ['456 Oak Ave'],
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US'
        },
        packages: [testPackage],
        serviceLevel: 'UPS_GROUND'
      };

      await carrier.getRates(request);

      const rateRequests = mockAdapter.history.post.filter((req: any) => req.url && req.url.includes('/api/rating/'));
      expect(rateRequests.length).toBeGreaterThan(0);
      const rateRequest = rateRequests[0];
      
      expect(rateRequest).toBeDefined();
      const requestData = typeof rateRequest.data === 'string' ? JSON.parse(rateRequest.data) : rateRequest.data;
      expect(requestData).toHaveProperty('RateRequest');
      expect(requestData).toMatchObject({
        RateRequest: {
          Shipment: {
            Shipper: {
              Address: {
                AddressLine: ['123 Main St'],
                City: 'New York',
                StateProvinceCode: 'NY',
                PostalCode: '10001',
                CountryCode: 'US'
              }
            },
            ShipTo: {
              Address: {
                AddressLine: ['456 Oak Ave'],
                City: 'Los Angeles',
                StateProvinceCode: 'CA',
                PostalCode: '90001',
                CountryCode: 'US'
              }
            }
          }
        }
      });
    });

    it('should handle packages with dimensions', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const rateResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '1',
              Description: 'Success'
            }
          },
          RatedShipment: [
            {
              Service: {
                Code: '03',
                Description: 'UPS Ground'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '15.50'
              }
            }
          ]
        }
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(`${testConfig.baseUrl}/api/rating/${testConfig.version}/${testConfig.requestOption}`).reply(200, rateResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [
          {
            weight: { value: 10, unit: 'lbs' },
            dimensions: {
              length: 12,
              width: 10,
              height: 8,
              unit: 'in'
            }
          }
        ]
      };

      await carrier.getRates(request);

      const rateRequests = mockAdapter.history.post.filter((req: any) => req.url && req.url.includes('/api/rating/'));
      expect(rateRequests.length).toBeGreaterThan(0);
      const rateRequest = rateRequests[0];
      const requestData = typeof rateRequest.data === 'string' ? JSON.parse(rateRequest.data) : rateRequest.data;
      const shipment = requestData?.RateRequest?.Shipment;
      
      const packages = Array.isArray(shipment?.Package) ? shipment.Package : [shipment?.Package];
      expect(packages.length).toBe(1);
      expect(packages[0]).toMatchObject({
        PackageWeight: {
          UnitOfMeasurement: { Code: 'LBS' },
          Weight: '10'
        },
        Dimensions: {
          UnitOfMeasurement: { Code: 'IN' },
          Length: '12',
          Width: '10',
          Height: '8'
        }
      });
    });
  });

  describe('Response Parsing', () => {
    it('should parse successful rate response', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const rateResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '1',
              Description: 'Success'
            },
            TransactionReference: {
              CustomerContext: 'test-trans-123'
            }
          },
          RatedShipment: [
            {
              Service: {
                Code: '03',
                Description: 'UPS Ground'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '15.50'
              },
              GuaranteedDelivery: {
                BusinessDaysInTransit: '3'
              }
            },
            {
              Service: {
                Code: '01',
                Description: 'UPS Next Day Air'
              },
              TotalCharges: {
                CurrencyCode: 'USD',
                MonetaryValue: '45.75'
              },
              GuaranteedDelivery: {
                BusinessDaysInTransit: '1'
              }
            }
          ]
        }
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(`${testConfig.baseUrl}/api/rating/${testConfig.version}/${testConfig.requestOption}`).reply(200, rateResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      const result = await carrier.getRates(request);

      expect(result.quotes).toHaveLength(2);
      expect(result.requestId).toBe('test-trans-123');

      expect(result.quotes[0]).toMatchObject({
        carrier: 'UPS',
        serviceLevel: '03',
        serviceName: 'UPS Ground',
        totalCost: {
          amount: 15.50,
          currency: 'USD'
        },
        estimatedDeliveryDays: 3,
        transitTime: '3 business days'
      });

      expect(result.quotes[1]).toMatchObject({
        carrier: 'UPS',
        serviceLevel: '01',
        serviceName: 'UPS Next Day Air',
        totalCost: {
          amount: 45.75,
          currency: 'USD'
        },
        estimatedDeliveryDays: 1
      });
    });

    it('should handle API error responses', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const errorResponse: UpsRateResponse = {
        RateResponse: {
          Response: {
            ResponseStatus: {
              Code: '0',
              Description: 'Failure'
            },
            Alert: [
              {
                Code: '110537',
                Description: 'The postal code 12345 is invalid for the country US.'
              }
            ]
          }
        }
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).reply(200, errorResponse);

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await expect(carrier.getRates(request)).rejects.toThrow(CarrierError);
      await expect(carrier.getRates(request)).rejects.toThrow('UPS API error');
    });

    it('should handle malformed responses', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).reply(200, { invalid: 'response' });

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await expect(carrier.getRates(request)).rejects.toThrow(CarrierError);
      await expect(carrier.getRates(request)).rejects.toThrow('Invalid UPS response');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).reply(429, { error: 'Rate limit exceeded' });

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await expect(carrier.getRates(request)).rejects.toThrow(CarrierError);
      await expect(carrier.getRates(request)).rejects.toThrow('rate limit exceeded');
    });

    it('should handle network timeouts', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).timeout();

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await expect(carrier.getRates(request)).rejects.toThrow(CarrierError);
    });

    it('should handle server errors', async () => {
      const authResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockAdapter.onPost(testConfig.authUrl).reply(200, authResponse);
      mockAdapter.onPost(new RegExp(`${testConfig.baseUrl}/api/rating/.*`)).reply(500, { error: 'Internal server error' });

      const request: RateRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [testPackage]
      };

      await expect(carrier.getRates(request)).rejects.toThrow(CarrierError);
      await expect(carrier.getRates(request)).rejects.toThrow('UPS server error');
    });
  });

  describe('Validation', () => {
    it('should validate request before making API call', async () => {
      const invalidRequest = {
        origin: testAddress,
        destination: testAddress,
        packages: [] // Empty packages array
      };

      await expect(carrier.getRates(invalidRequest as RateRequest)).rejects.toThrow(CarrierError);
      await expect(carrier.getRates(invalidRequest as RateRequest)).rejects.toThrow('Invalid rate request');
    });
  });
});
