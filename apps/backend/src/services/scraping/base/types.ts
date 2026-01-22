import {z} from 'zod';

export enum ScrapedImageType {
  Flyer = 'flyer',
  Hero = 'hero',
}

export enum Platform {
  Entraste = 'entraste',
  Passline = 'passline',
  RedTickets = 'redtickets',
}

export interface PlatformConfig {
  name: Platform;
  baseUrl: string;
  scrapingEnabled: boolean;
  rateLimit: number; // requests per minute
  headers?: Record<string, string>;
}

export const ScrapedTicketWaveSchema = z.object({
  externalId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  faceValue: z.number(),
  currency: z.enum(['UYU', 'USD']),
  isSoldOut: z.boolean(),
  isAvailable: z.boolean(),
  metadata: z.record(z.string(), z.any()).optional(), // Additional platform-specific data
});

export type ScrapedTicketWave = z.infer<typeof ScrapedTicketWaveSchema>;

export const QrAvailabilityTimingSchema = z.enum([
  '3h',
  '6h',
  '12h',
  '24h',
  '48h',
  '72h',
]);

export type QrAvailabilityTiming = z.infer<typeof QrAvailabilityTimingSchema>;

export const ScrapedEventDataSchema = z.object({
  externalId: z.string(),
  platform: z.enum(Platform),
  name: z.string(),
  description: z.string().optional(),
  eventStartDate: z.date(),
  eventEndDate: z.date(),
  // Venue data for finding/creating venue via VenuesService
  scrapedVenueName: z.string().optional(),
  scrapedVenueAddress: z.string(),
  scrapedVenueLatitude: z.number().optional(),
  scrapedVenueLongitude: z.number().optional(),
  // Venue ID (populated after processing through VenuesService)
  venueId: z.string().uuid().optional(),
  externalUrl: z.url(),
  images: z.array(
    z.object({
      type: z.enum(ScrapedImageType),
      url: z.url(),
    }),
  ),
  ticketWaves: z.array(ScrapedTicketWaveSchema),
  qrAvailabilityTiming: QrAvailabilityTimingSchema.optional(),
});

export type ScrapedEventData = z.infer<typeof ScrapedEventDataSchema>;
