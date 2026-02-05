import { Request, Response } from 'express';
import { CarrierService } from '../services/carrier.service';
import { CarrierError } from '../types/errors';
import { RateRequest } from '../types/domain';
import { getStatusCodeForError } from '../utils/error-handler';

export class RateController {
  private carrierService: CarrierService;

  constructor() {
    this.carrierService = new CarrierService();
  }

  getRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const carrierName = req.params.carrier || req.query.carrier || req.body.carrier;
      if (!carrierName) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Carrier is required. Available carriers: ' + this.carrierService.getAvailableCarriers().join(', ')
        });
        return;
      }
      const rateRequest: RateRequest = req.body;

      if (!rateRequest.origin || !rateRequest.destination || !rateRequest.packages) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields: origin, destination, and packages are required'
        });
        return;
      }

      const response = await this.carrierService.getRates(carrierName, rateRequest);

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      if (error instanceof CarrierError) {
        const statusCode = getStatusCodeForError(error.code);
        res.status(statusCode).json({
          error: error.code,
          message: error.message,
          details: error.details
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };
  getCarriers = async (req: Request, res: Response): Promise<void> => {
    try {
      const carriers = this.carrierService.getAvailableCarriers();
      res.status(200).json({
        success: true,
        data: carriers
      });
    } catch (error) {
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };
}
