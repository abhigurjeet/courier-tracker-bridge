import { UpsCarrier } from '../carriers/ups/ups-carrier';
import { MemoryTokenCache } from '../auth/token-cache';
import { loadConfig } from '../config';
import { RateRequest } from '../types/domain';
import { CarrierError } from '../types/errors';

async function example() {
  try {
    const config = loadConfig();

    const tokenCache = new MemoryTokenCache();

    const carrier = new UpsCarrier(
      {
        baseUrl: config.ups.baseUrl,
        clientId: config.ups.clientId,
        clientSecret: config.ups.clientSecret,
        authUrl: config.ups.authUrl
      },
      tokenCache,
      config.http.timeoutMs
    );

    // Create a rate request
    const rateRequest: RateRequest = {
      origin: {
        street: ['123 Main Street'],
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      },
      destination: {
        street: ['456 Oak Avenue', 'Suite 200'],
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US'
      },
      packages: [
        {
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
        },
        {
          weight: {
            value: 2.5,
            unit: 'lbs'
          },
          dimensions: {
            length: 8,
            width: 6,
            height: 4,
            unit: 'in'
          }
        }
      ],
      serviceLevel: 'UPS_GROUND'
    };

    console.log('Requesting rates from UPS...');
    const response = await carrier.getRates(rateRequest);

    console.log(`\nFound ${response.quotes.length} rate quote(s):\n`);
    
    response.quotes.forEach((quote, index) => {
      console.log(`Quote ${index + 1}:`);
      console.log(`  Carrier: ${quote.carrier}`);
      console.log(`  Service: ${quote.serviceName} (${quote.serviceLevel})`);
      console.log(`  Cost: ${quote.totalCost.currency} ${quote.totalCost.amount.toFixed(2)}`);
      
      if (quote.estimatedDeliveryDays) {
        console.log(`  Estimated Delivery: ${quote.estimatedDeliveryDays} business days`);
      }
      
      if (quote.estimatedDeliveryDate) {
        console.log(`  Delivery Date: ${quote.estimatedDeliveryDate.toLocaleDateString()}`);
      }
      
      if (quote.transitTime) {
        console.log(`  Transit Time: ${quote.transitTime}`);
      }
      
      console.log('');
    });

    if (response.requestId) {
      console.log(`Request ID: ${response.requestId}`);
    }

  } catch (error) {
    if (error instanceof CarrierError) {
      console.error('Carrier Error:');
      console.error(`  Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      
      if (error.details) {
        console.error(`  Details:`, error.details);
      }
      
      if (error.originalError) {
        console.error(`  Original Error: ${error.originalError.message}`);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  example().catch(console.error);
}

export { example };
