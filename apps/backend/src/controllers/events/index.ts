import express from 'express';
import {
  Route,
  Get,
  Post,
  Tags,
  Middlewares,
  Request,
  Queries,
  Path,
  Query,
} from '@mathfalcon/tsoa-runtime';
import {EventsService} from '~/services';
import {EventViewsService} from '~/services/event-views';
import {
  ensurePagination,
  paginationMiddleware,
  PaginationQuery,
} from '~/middleware';
import {EventsRepository, EventViewsRepository} from '~/repositories';
import {db} from '~/db';

// Explicit response types for TSOA (Kysely inferred types are too complex)
interface EventImage {
  url: string;
  imageType: string;
}

interface PaginatedEvent {
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

interface PaginatedEventsResponse {
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

interface PriceGroup {
  price: string;
  availableTickets: string | number;
}

interface TicketWave {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  faceValue: string;
  priceGroups: PriceGroup[];
}

interface EventDetail {
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

interface SearchEvent {
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

interface TrendingEvent {
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

type GetEventsPaginatedResponse = Promise<PaginatedEventsResponse>;
type GetEventByIdResponse = Promise<EventDetail>;
type SearchEventsResponse = Promise<SearchEvent[]>;
type GetDistinctCitiesResponse = Promise<string[]>;
type TrackViewResponse = Promise<{success: boolean}>;
type GetTrendingEventsResponse = Promise<TrendingEvent[]>;

interface EventsPaginatedQuery extends PaginationQuery {
  /**
   * Filter by city name
   */
  city?: string;
}

@Route('events')
@Tags('Events')
export class EventsController {
  private service = new EventsService(new EventsRepository(db));
  private eventViewsService = new EventViewsService(
    new EventViewsRepository(db),
  );

  @Get('/')
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  public async getAllPaginated(
    @Queries() query: EventsPaginatedQuery,
    @Request() request: express.Request,
  ): Promise<GetEventsPaginatedResponse> {
    return this.service.getAllEventsPaginated(
      {
        pagination: request.pagination!,
        city: query.city,
      },
      request.user?.id,
    );
  }

  @Get('/search')
  public async getBySearch(
    @Query() query: string,
    @Query() limit?: number,
  ): Promise<SearchEventsResponse> {
    return this.service.getBySearch(query, limit);
  }

  /**
   * Get trending events based on view count in the last N days
   */
  @Get('/trending')
  public async getTrendingEvents(
    @Query() days?: number,
    @Query() limit?: number,
  ): Promise<GetTrendingEventsResponse> {
    return this.eventViewsService.getTrendingEvents(days ?? 7, limit ?? 10);
  }

  /**
   * Get list of distinct cities for filter dropdown
   */
  @Get('/cities')
  public async getDistinctCities(): Promise<GetDistinctCitiesResponse> {
    return this.service.getDistinctCities();
  }

  @Get('/{eventId}')
  public async getById(
    @Path() eventId: string,
    @Request() request: express.Request,
  ): Promise<GetEventByIdResponse> {
    return this.service.getEventById(eventId, request.user?.id);
  }

  /**
   * Track a view for an event (called when user views event detail page)
   */
  @Post('/{eventId}/view')
  public async trackView(@Path() eventId: string): Promise<TrackViewResponse> {
    await this.eventViewsService.trackView(eventId);
    return {success: true};
  }
}
