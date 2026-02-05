import { Address, Package, RateRequest } from '../../types/domain';
import { UpsAddress, UpsPackage, UpsRateRequest } from './types';

export class UpsMapper {
  static toUpsAddress(address: Address): UpsAddress {
    return {
      AddressLine: address.street,
      City: address.city,
      StateProvinceCode: address.state,
      PostalCode: address.postalCode,
      CountryCode: address.country
    };
  }

  static toUpsPackage(pkg: Package): UpsPackage {
    const weightUnit = pkg.weight.unit === 'lbs' ? 'LBS' : 'KGS';
    const weightValue = pkg.weight.value.toString();

    const upsPackage: UpsPackage = {
      PackagingType: {
        Code: '02',
        Description: 'Packaging'
      },
      PackageWeight: {
        UnitOfMeasurement: {
          Code: weightUnit,
          Description: weightUnit === 'LBS' ? 'Pounds' : 'Kilograms'
        },
        Weight: weightValue
      }
    };

    if (pkg.dimensions) {
      const dimUnit = pkg.dimensions.unit === 'in' ? 'IN' : 'CM';
      upsPackage.Dimensions = {
        UnitOfMeasurement: {
          Code: dimUnit,
          Description: dimUnit === 'IN' ? 'Inches' : 'Centimeters'
        },
        Length: pkg.dimensions.length.toString(),
        Width: pkg.dimensions.width.toString(),
        Height: pkg.dimensions.height.toString()
      };
    }

    return upsPackage;
  }

  static toUpsRateRequest(request: RateRequest): UpsRateRequest {
    const serviceCode = request.serviceLevel
      ? this.mapServiceLevelToCode(request.serviceLevel)
      : undefined;

    const numOfPieces = request.packages.length.toString();
    const upsPackages = request.packages.map(pkg => this.toUpsPackage(pkg));
    
    const packageField = upsPackages.length === 1 ? upsPackages[0] : upsPackages;

    return {
      RateRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: 'Cybership Rate Request'
          }
        },
        Shipment: {
          Shipper: {
            Address: this.toUpsAddress(request.origin)
          },
          ShipTo: {
            Address: this.toUpsAddress(request.destination)
          },
          ShipFrom: {
            Address: this.toUpsAddress(request.origin)
          },
          PaymentDetails: {
            ShipmentCharge: [
              {
                Type: '01',
                BillShipper: {
                  AccountNumber: ''
                }
              }
            ]
          },
          ...(serviceCode && {
            Service: {
              Code: serviceCode,
              Description: this.getServiceDescription(serviceCode)
            }
          }),
          NumOfPieces: numOfPieces,
          Package: packageField
        }
      }
    };
  }

  private static mapServiceLevelToCode(serviceLevel: string): string | undefined {
    const mapping: Record<string, string> = {
      'UPS_GROUND': '03',
      'UPS_STANDARD': '11',
      'UPS_3_DAY_SELECT': '12',
      'UPS_2ND_DAY_AIR': '02',
      'UPS_2ND_DAY_AIR_AM': '59',
      'UPS_NEXT_DAY_AIR': '01',
      'UPS_NEXT_DAY_AIR_SAVER': '13',
      'UPS_NEXT_DAY_AIR_EARLY_AM': '14'
    };

    return mapping[serviceLevel] || serviceLevel;
  }

  private static getServiceDescription(code: string): string {
    const descriptions: Record<string, string> = {
      '01': 'UPS Next Day Air',
      '02': 'UPS 2nd Day Air',
      '03': 'UPS Ground',
      '11': 'UPS Standard',
      '12': 'UPS 3 Day Select',
      '13': 'UPS Next Day Air Saver',
      '14': 'UPS Next Day Air Early AM',
      '59': 'UPS 2nd Day Air AM'
    };

    return descriptions[code] || 'UPS Service';
  }
}
