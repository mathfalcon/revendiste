/**
 * Explicit response types for the Admin Events controller
 * These are needed because Kysely's inferred types are too complex for TSOA
 */

export interface AdminEventImage {
  id: string;
  url: string;
  imageType: string;
  displayOrder: number;
  createdAt?: Date | string;
}

export interface AdminTicketWave {
  id: string;
  name: string;
  description: string | null;
  faceValue: string;
  currency: string;
  isSoldOut: boolean;
  isAvailable: boolean;
  externalId: string;
  status: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AdminEvent {
  id: string;
  name: string;
  description: string | null;
  eventStartDate: Date;
  eventEndDate: Date;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  externalUrl: string;
  externalId: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  images: AdminEventImage[];
  ticketWaves: AdminTicketWave[];
}

export interface AdminEventDetail extends AdminEvent {
  metadata: unknown;
  lastScrapedAt: Date;
}

export interface PaginatedAdminEventsResponse {
  data: AdminEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UpdatedEvent {
  id: string;
  name: string;
  description: string | null;
  eventStartDate: Date;
  eventEndDate: Date;
  venueId: string | null;
  externalUrl: string;
  externalId: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  lastScrapedAt: Date;
  deletedAt: Date | null;
}

export interface DeletedEvent extends UpdatedEvent {}

export interface CreatedTicketWave {
  id: string;
  eventId: string;
  externalId: string;
  name: string;
  description: string | null;
  faceValue: string;
  currency: string;
  isSoldOut: boolean;
  isAvailable: boolean;
  status: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  lastScrapedAt: Date;
  deletedAt: Date | null;
}

export interface UpdatedTicketWave extends CreatedTicketWave {}
export interface DeletedTicketWave extends CreatedTicketWave {}

export interface UploadEventImageResponse {
  id: string;
  url: string;
  imageType: string;
}

export interface DeleteEventImageResponse {
  success: boolean;
}
