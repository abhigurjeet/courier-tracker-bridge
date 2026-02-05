# Cybership Carrier Integration Service

TypeScript service for shipping carrier integration with UPS Rating API. Extensible architecture using registry pattern for adding new carriers.

## Quick Start

```bash
npm install
cp env.example .env  # Add UPS_CLIENT_ID and UPS_CLIENT_SECRET
npm run build
npm start  # or npm run dev
```

## API

**Get Rates:**
```bash
POST /api/rates/:carrier?  # carrier in route/query/body (default: UPS)
Content-Type: application/json

{
  "origin": { "street": ["123 Main St"], "city": "New York", "state": "NY", "postalCode": "10001", "country": "US" },
  "destination": { "street": ["456 Oak Ave"], "city": "LA", "state": "CA", "postalCode": "90001", "country": "US" },
  "packages": [{ "weight": { "value": 5, "unit": "lbs" } }]
}
```

**List Carriers:**
```bash
GET /api/carriers
```

## Adding New Carriers

1. Create `src/carriers/fedex/fedex-carrier.ts` (extends `BaseCarrier`)
2. Add config in `src/config/index.ts`:
   ```typescript
   if (process.env.FEDEX_API_KEY) {
     carriers.FEDEX = { apiKey: getEnvVar('FEDEX_API_KEY'), ... };
   }
   ```
3. Register in `CarrierService` constructor
4. Add env vars to `.env.example`

Carrier automatically available via API. No changes to controllers/routes needed.

## Architecture

- **Registry Pattern**: `CarrierService` manages carriers in `Map<string, Carrier>`
- **Domain Models**: Carrier-agnostic types (`Address`, `Package`, `RateRequest`)
- **Authentication**: UPS OAuth 2.0 with token caching
- **Validation**: Zod schemas with TypeScript types
- **Testing**: `axios-mock-adapter` for stubbed HTTP responses

## Tech Stack

- TypeScript, Express, Axios, Zod
- Routes/Controllers/Services pattern

## License

MIT
