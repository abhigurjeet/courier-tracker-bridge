import { z } from 'zod';
import { Address, Package, RateRequest } from '../types/domain';

export const AddressSchema: z.ZodType<Address> = z.object({
  street: z.array(z.string().min(1)).min(1).max(3),
  city: z.string().min(1),
  state: z.string().length(2),
  postalCode: z.string().min(5).max(10),
  country: z.string().length(2)
});

export const PackageSchema: z.ZodType<Package> = z.object({
  weight: z.object({
    value: z.number().positive(),
    unit: z.enum(['lbs', 'kg'])
  }),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['in', 'cm'])
  }).optional()
});

export const RateRequestSchema: z.ZodType<RateRequest> = z.object({
  origin: AddressSchema,
  destination: AddressSchema,
  packages: z.array(PackageSchema).min(1).max(200),
  serviceLevel: z.string().optional()
});
