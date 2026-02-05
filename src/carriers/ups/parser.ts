import { RateQuote, RateResponse } from '../../types/domain';
import { UpsRateResponse, UpsErrorResponse } from './types';
import { CarrierError, ErrorCode } from '../../types/errors';

export class UpsParser {
  static parseRateResponse(upsResponse: UpsRateResponse | UpsErrorResponse, requestId?: string): RateResponse {
    if ('response' in upsResponse && upsResponse.response?.errors) {
      const errors = upsResponse.response.errors;
      if (errors.length > 0) {
        const errorMessages = errors.map((e: any) => e.message || e.code || 'Unknown error').join(', ');
        throw new CarrierError(
          ErrorCode.API_ERROR,
          `UPS API error: ${errorMessages}`,
          { errors }
        );
      }
    }

    if (!('RateResponse' in upsResponse) || !upsResponse.RateResponse) {
      throw new CarrierError(
        ErrorCode.MALFORMED_RESPONSE,
        'Invalid UPS response: missing RateResponse'
      );
    }

    const response = upsResponse.RateResponse;

    const statusCode = response.Response?.ResponseStatus?.Code;
    if (statusCode && statusCode !== '1' && statusCode !== 's') {
      const description = response.Response?.ResponseStatus?.Description || 'Unknown error';
      const alerts = response.Response?.Alert?.map((a: any) => a.Description).join(', ') || '';
      const alertDetails = response.Response?.AlertDetail?.map((a: any) => a.Description).join(', ') || '';
      
      const allAlerts = [alerts, alertDetails].filter(Boolean).join(', ');
      
      throw new CarrierError(
        ErrorCode.API_ERROR,
        `UPS API error: ${description}${allAlerts ? ` - ${allAlerts}` : ''}`,
        {
          statusCode,
          alerts: response.Response?.Alert,
          alertDetails: response.Response?.AlertDetail
        }
      );
    }

    if (!response.RatedShipment || response.RatedShipment.length === 0) {
      throw new CarrierError(
        ErrorCode.API_ERROR,
        'UPS response contains no rated shipments'
      );
    }

    const quotes: RateQuote[] = response.RatedShipment.map((shipment: any) => {
      const serviceCode = shipment.Service?.Code || 'UNKNOWN';
      const serviceName = shipment.Service?.Description || 'Unknown Service';

      const totalCharges = shipment.TotalChargesWithTaxes || 
                          shipment.TotalCharges || 
                          shipment.TransportationCharges;
      
      if (!totalCharges) {
        throw new CarrierError(
          ErrorCode.MALFORMED_RESPONSE,
          'UPS response missing total charges'
        );
      }

      const amount = parseFloat(totalCharges.MonetaryValue);
      if (isNaN(amount)) {
        throw new CarrierError(
          ErrorCode.MALFORMED_RESPONSE,
          `Invalid monetary value: ${totalCharges.MonetaryValue}`
        );
      }

      const timeInTransit = shipment.TimeInTransit;
      const guaranteedDelivery = shipment.GuaranteedDelivery;
      
      let estimatedDeliveryDays: number | undefined;
      if (timeInTransit?.ServiceSummary?.EstimatedArrival?.BusinessDaysInTransit) {
        estimatedDeliveryDays = parseInt(
          timeInTransit.ServiceSummary.EstimatedArrival.BusinessDaysInTransit, 
          10
        );
      } else if (guaranteedDelivery?.BusinessDaysInTransit) {
        estimatedDeliveryDays = parseInt(guaranteedDelivery.BusinessDaysInTransit, 10);
      }

      let transitTime: string | undefined;
      if (timeInTransit?.ServiceSummary?.EstimatedArrival?.TotalTransitDays) {
        transitTime = `${timeInTransit.ServiceSummary.EstimatedArrival.TotalTransitDays} transit days`;
      } else if (estimatedDeliveryDays !== undefined) {
        transitTime = `${estimatedDeliveryDays} business days`;
      }

      const quote: RateQuote = {
        carrier: 'UPS',
        serviceLevel: serviceCode,
        serviceName,
        totalCost: {
          amount,
          currency: totalCharges.CurrencyCode || 'USD'
        },
        estimatedDeliveryDays,
        transitTime
      };

      if (timeInTransit?.ServiceSummary?.EstimatedArrival?.Arrival?.Date) {
        quote.estimatedDeliveryDate = new Date(timeInTransit.ServiceSummary.EstimatedArrival.Arrival.Date);
      } else if (guaranteedDelivery?.ScheduledDeliveryDate) {
        quote.estimatedDeliveryDate = new Date(guaranteedDelivery.ScheduledDeliveryDate);
      } else if (estimatedDeliveryDays !== undefined) {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + estimatedDeliveryDays);
        quote.estimatedDeliveryDate = deliveryDate;
      }

      return quote;
    });

    return {
      quotes,
      requestId: requestId || response.Response?.TransactionReference?.CustomerContext
    };
  }
}
