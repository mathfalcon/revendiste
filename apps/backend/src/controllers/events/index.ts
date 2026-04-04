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
import {VenuesRepository} from '~/repositories/venues';
import {VenuesService} from '~/services/venues';
import {GooglePlacesService} from '~/services/google-places';
import {db} from '~/db';

// --- Explicit controller response types for TSOA Swagger generation ---
// Always use named type aliases for controller return values (see Custom Rules).

export type GetEventsPaginatedResponse = ReturnType<
  EventsService['getAllEventsPaginated']
>;
export type SearchEventsResponse = ReturnType<EventsService['getBySearch']>;
export type GetTrendingEventsResponse = ReturnType<
  EventViewsService['getTrendingEvents']
>;
export type GetDistinctCitiesResponse = ReturnType<
  EventsService['getDistinctCities']
>;
export type GetDistinctRegionsResponse = ReturnType<
  VenuesService['getDistinctRegions']
>;
export type GetEventByIdResponse = ReturnType<EventsService['getEventById']>;
export type GetEventBySlugResponse = GetEventByIdResponse;
export type TrackViewResponse = {success: boolean};

interface EventsPaginatedQuery extends PaginationQuery {
  /** Filter by city name */
  city?: string;
  /** Filter by region/state/departamento name */
  region?: string;
  /** Latitude for proximity search (requires lng) */
  lat?: number;
  /** Longitude for proximity search (requires lat) */
  lng?: number;
  /** Radius in km for proximity search (default: 30) */
  radiusKm?: number;
  /** Filter events starting from this date (ISO format) */
  dateFrom?: string;
  /** Filter events ending before this date (ISO format) */
  dateTo?: string;
  /** Only show events with at least one available ticket */
  hasTickets?: boolean;
  /** User timezone offset in minutes from UTC (e.g. 180 for UTC-3) */
  tzOffset?: number;
}

@Route('events')
@Tags('Events')
export class EventsController {
  private service = new EventsService(new EventsRepository(db));
  private eventViewsService = new EventViewsService(
    new EventViewsRepository(db),
  );
  private venuesService = new VenuesService(
    new VenuesRepository(db),
    new GooglePlacesService(),
  );

  @Get('/')
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  public async getAllPaginated(
    @Queries() query: EventsPaginatedQuery,
    @Request() request: express.Request,
  ): GetEventsPaginatedResponse {
    return this.service.getAllEventsPaginated(
      {
        pagination: request.pagination!,
        city: query.city,
        region: query.region,
        lat: query.lat != null ? Number(query.lat) : undefined,
        lng: query.lng != null ? Number(query.lng) : undefined,
        radiusKm: query.radiusKm != null ? Number(query.radiusKm) : undefined,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        hasTickets: query.hasTickets != null ? String(query.hasTickets) === 'true' : undefined,
        tzOffset: query.tzOffset != null ? Number(query.tzOffset) : undefined,
      },
      request.user?.id,
    );
  }

  @Get('/search')
  public async getBySearch(
    @Query() query: string,
    @Query() limit?: number,
  ): SearchEventsResponse {
    return this.service.getBySearch(query, limit);
  }

  /**
   * Get trending events based on view count in the last N days
   */
  @Get('/trending')
  public async getTrendingEvents(
    @Query() days?: number,
    @Query() limit?: number,
    @Query() region?: string,
    @Query() lat?: number,
    @Query() lng?: number,
    @Query() radiusKm?: number,
  ): GetTrendingEventsResponse {
    return this.eventViewsService.getTrendingEvents(days ?? 7, limit ?? 10, {
      region,
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
      radiusKm: radiusKm != null ? Number(radiusKm) : undefined,
    });
  }

  /**
   * Get list of distinct cities for filter dropdown
   */
  @Get('/cities')
  public async getDistinctCities(): GetDistinctCitiesResponse {
    return this.service.getDistinctCities();
  }

  /**
   * Get distinct regions with active events, grouped by country
   */
  @Get('/regions')
  public async getDistinctRegions(): GetDistinctRegionsResponse {
    return this.venuesService.getDistinctRegions();
  }

  /**
   * Get event details by slug (public, used by frontend)
   */
  @Get('/by-slug/{slug}')
  public async getBySlug(
    @Path() slug: string,
    @Request() request: express.Request,
  ): GetEventBySlugResponse {
    return this.service.getEventBySlug(slug, request.user?.id);
  }

  /**
   * Track a view for an event by slug (called from route loader on actual navigation)
   */
  @Post('/by-slug/{slug}/view')
  public async trackViewBySlug(
    @Path() slug: string,
  ): Promise<TrackViewResponse> {
    const event = await this.service.getEventBySlug(slug);
    await this.eventViewsService.trackView(event.id);
    return {success: true};
  }

  @Get('/{eventId}')
  public async getById(
    @Path() eventId: string,
    @Request() request: express.Request,
  ): GetEventByIdResponse {
    return this.service.getEventById(eventId, request.user?.id);
  }

  /**
   * Track a view for an event (called from route loader on actual navigation, not prefetch)
   */
  @Post('/{eventId}/view')
  public async trackView(@Path() eventId: string): Promise<TrackViewResponse> {
    await this.eventViewsService.trackView(eventId);
    return {success: true};
  }
}
