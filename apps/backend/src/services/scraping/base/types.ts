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

export const ScrapedEventDataSchema = z.object({
  externalId: z.string(),
  platform: z.enum(Platform),
  name: z.string(),
  description: z.string().optional(),
  eventStartDate: z.date(),
  eventEndDate: z.date(),
  venueName: z.string().optional(),
  venueAddress: z.string(),
  externalUrl: z.url(),
  images: z.array(
    z.object({
      type: z.enum(ScrapedImageType),
      url: z.url(),
    }),
  ),
  ticketWaves: z.array(ScrapedTicketWaveSchema),
});

export type ScrapedEventData = z.infer<typeof ScrapedEventDataSchema>;
