/**
 * Explicit response types for the Events controller
 * These are needed because Kysely's inferred types are too complex for TSOA
 */

export interface EventImage {
  url: string;
  imageType: string;
}

export interface PaginatedEvent {
  id: string;
  name: string;
  description: string | null;
  eventStartDate: Date;
  eventEndDate: Date;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  externalUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lowestAvailableTicketPrice: number | null;
  lowestAvailableTicketCurrency: string | null;
  images: EventImage[];
}

export interface PaginatedEventsResponse {
  data: PaginatedEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PriceGroup {
  price: string;
  availableTickets: number;
}

export interface TicketWave {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  faceValue: string;
  priceGroups: PriceGroup[];
}

export interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  eventStartDate: Date;
  eventEndDate: Date;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  externalUrl: string;
  qrAvailabilityTiming: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userListingsCount: number;
  eventImages: EventImage[];
  ticketWaves: TicketWave[];
}

export interface SearchEvent {
  id: string;
  name: string;
  description: string | null;
  eventStartDate: Date;
  eventEndDate: Date;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  externalUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventImages: EventImage[];
}

export interface TrendingEvent {
  id: string;
  name: string;
  description: string | null;
  eventStartDate: Date;
  eventEndDate: Date;
  venueId: string | null;
  externalUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  totalViews: number;
  eventImages: EventImage[];
  venue: {name: string; city: string} | null;
}
