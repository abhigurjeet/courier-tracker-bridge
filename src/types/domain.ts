export interface Address {
  street: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Package {
  weight: {
    value: number;
    unit: 'lbs' | 'kg';
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
}

export interface RateRequest {
  origin: Address;
  destination: Address;
  packages: Package[];
  serviceLevel?: string;
}

export interface RateQuote {
  carrier: string;
  serviceLevel: string;
  serviceName: string;
  totalCost: {
    amount: number;
    currency: string;
  };
  estimatedDeliveryDays?: number;
  estimatedDeliveryDate?: Date;
  transitTime?: string;
}

export interface RateResponse {
  quotes: RateQuote[];
  requestId?: string;
}
