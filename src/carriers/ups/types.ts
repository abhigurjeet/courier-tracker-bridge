export interface UpsAddress {
  AddressLine?: string[];
  City: string;
  StateProvinceCode: string;
  PostalCode: string;
  CountryCode: string;
}

export interface UpsPackage {
  SimpleRate?: {
    Description?: string;
    Code: string;
  };
  PackagingType?: {
    Code: string;
    Description?: string;
  };
  Dimensions?: {
    UnitOfMeasurement: {
      Code: string;
      Description?: string;
    };
    Length: string;
    Width: string;
    Height: string;
  };
  PackageWeight: {
    UnitOfMeasurement: {
      Code: string;
      Description?: string;
    };
    Weight: string;
  };
}

export interface UpsRateRequest {
  RateRequest: {
    Request: {
      TransactionReference?: {
        CustomerContext?: string;
      };
    };
    Shipment: {
      Shipper: {
        Name?: string;
        ShipperNumber?: string;
        Address: UpsAddress;
      };
      ShipTo: {
        Name?: string;
        Address: UpsAddress;
      };
      ShipFrom?: {
        Name?: string;
        Address: UpsAddress;
      };
      PaymentDetails?: {
        ShipmentCharge: Array<{
          Type: string;
          BillShipper: {
            AccountNumber?: string;
          };
        }>;
      };
      Service?: {
        Code: string;
        Description?: string;
      };
      NumOfPieces?: string;
      Package: UpsPackage | UpsPackage[];
    };
  };
}

export interface UpsRateResponse {
  RateResponse?: {
    Response?: {
      ResponseStatus?: {
        Code: string;
        Description: string;
      };
      Alert?: Array<{
        Code: string;
        Description: string;
      }>;
      AlertDetail?: Array<{
        Code: string;
        Description: string;
        ElementLevelInformation?: {
          Level: string;
          ElementIdentifier?: Array<{
            Code: string | null;
            Value: string | null;
          }>;
        };
      }>;
      TransactionReference?: {
        CustomerContext?: string;
      };
    };
    RatedShipment?: Array<{
      Disclaimer?: Array<{
        Code: string;
        Description: string;
      }>;
      Service?: {
        Code: string;
        Description?: string;
      };
      RateChart?: string;
      Zone?: string;
      RatedShipmentAlert?: Array<{
        Code: string;
        Description: string;
      }>;
      BillableWeightCalculationMethod?: string;
      RatingMethod?: string;
      BillingWeight?: {
        UnitOfMeasurement?: {
          Code: string;
          Description?: string;
        };
        Weight?: string;
      };
      TransportationCharges?: {
        CurrencyCode: string;
        MonetaryValue: string;
      };
      BaseServiceCharge?: {
        CurrencyCode: string;
        MonetaryValue: string;
      };
      ItemizedCharges?: Array<{
        Code: string;
        Description?: string;
        CurrencyCode: string;
        MonetaryValue: string;
        SubType?: string;
      }>;
      FRSShipmentData?: {
        TransportationCharges?: {
          GrossCharge?: {
            CurrencyCode: string;
            MonetaryValue: string;
          };
          DiscountAmount?: {
            CurrencyCode: string;
            MonetaryValue: string;
          };
          DiscountPercentage?: string;
          NetCharge?: {
            CurrencyCode: string;
            MonetaryValue: string;
          };
        };
        FreightDensityRate?: {
          Density?: string;
          TotalCubicFeet?: string;
        };
        HandlingUnits?: Array<{
          Quantity?: string;
          Type?: {
            Code: string | null;
            Description: string | null;
          };
          Dimensions?: {
            UnitOfMeasurement?: string | null;
            Length?: string | null;
            Width?: string | null;
            Height?: string | null;
          };
          AdjustedHeight?: {
            Value?: string | null;
            UnitOfMeasurement?: string | null;
          };
        }>;
      };
      ServiceOptionsCharges?: {
        CurrencyCode: string;
        MonetaryValue: string;
      };
      TaxCharges?: Array<{
        Type: string;
        MonetaryValue: string;
      }>;
      TotalCharges?: {
        CurrencyCode: string;
        MonetaryValue: string;
      };
      TotalChargesWithTaxes?: {
        CurrencyCode: string;
        MonetaryValue: string;
      };
      NegotiatedRateCharges?: {
        BaseServiceCharge?: Array<{
          CurrencyCode: string;
          MonetaryValue: string;
        }>;
        RateModifier?: Array<{
          ModifierType: string;
          ModifierDesc?: string;
          Amount?: string;
        }>;
        ItemizedCharges?: Array<{
          Code: string;
          Description?: string;
          CurrencyCode: string;
          MonetaryValue: string;
          SubType?: string;
        }>;
        TaxCharges?: Array<{
          Type: string;
          MonetaryValue: string;
        }>;
        TotalCharge?: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
        TotalChargesWithTaxes?: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
      };
      RatedPackage?: Array<{
        BaseServiceCharge?: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
        TransportationCharges?: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
        ServiceOptionsCharges?: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
        TotalCharges?: {
          CurrencyCode: string;
          MonetaryValue: string;
        };
        Weight?: string;
        BillingWeight?: {
          UnitOfMeasurement?: {
            Code: string | null;
            Description?: string | null;
          };
          Weight?: string;
        };
        Accessorial?: Array<{
          Code: string | null;
          Description: string | null;
        }>;
        ItemizedCharges?: Array<{
          Code: string | null;
          Description?: string | null;
          CurrencyCode?: string | null;
          MonetaryValue?: string | null;
          SubType?: string | null;
        }>;
        NegotiatedCharges?: {
          RateModifier?: Array<any>;
          ItemizedCharges?: Array<any>;
        };
        SimpleRate?: {
          Code: string;
        };
        RateModifier?: Array<{
          ModifierType?: string | null;
          ModifierDesc?: string | null;
          Amount?: string | null;
        }>;
      }>;
      TimeInTransit?: {
        PickupDate?: string;
        DocumentsOnlyIndicator?: string;
        PackageBillType?: string;
        ServiceSummary?: {
          Service?: {
            Description?: string;
          };
          GuaranteedIndicator?: string;
          Disclaimer?: string;
          EstimatedArrival?: {
            Arrival?: {
              Date?: string | null;
              Time?: string | null;
            };
            BusinessDaysInTransit?: string;
            Pickup?: {
              Date?: string | null;
              Time?: string | null;
            };
            DayOfWeek?: string;
            CustomerCenterCutoff?: string;
            DelayCount?: string;
            HolidayCount?: string;
            RestDays?: string;
            TotalTransitDays?: string;
          };
          SaturdayDelivery?: string;
          SaturdayDeliveryDisclaimer?: string;
          SundayDelivery?: string;
          SundayDeliveryDisclaimer?: string;
        };
        AutoDutyCode?: string;
        Disclaimer?: string;
      };
      GuaranteedDelivery?: {
        BusinessDaysInTransit?: string;
        DeliveryByTime?: string;
        ScheduledDeliveryDate?: string;
      };
      RoarRatedIndicator?: string;
    }>;
  };
}

export interface UpsErrorResponse {
  response?: {
    errors?: Array<{
      code?: string;
      message?: string;
      [key: string]: any;
    }>;
  };
}
