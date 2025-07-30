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
});

export type ScrapedEventData = z.infer<typeof ScrapedEventDataSchema>;

export interface ScrapedTicketWave {
  external_wave_id: string;
  name: string;
  description?: string;
  face_value: number;
  currency: string;
  sale_start?: Date;
  sale_end?: Date;
  total_quantity?: number;
  sold_quantity?: number;
  platform_data: Record<string, any>;
}
