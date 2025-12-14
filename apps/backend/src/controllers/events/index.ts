import express from 'express';
import {
  Route,
  Get,
  Tags,
  Middlewares,
  Request,
  Queries,
  Path,
  Query,
} from '@tsoa/runtime';
import {EventsService} from '~/services';
import {
  ensurePagination,
  paginationMiddleware,
  PaginationQuery,
} from '~/middleware';
import {EventsRepository} from '~/repositories';
import {db} from '~/db';

type GetEventsPaginatedResponse = Promise<
  ReturnType<EventsService['getAllEventsPaginated']>
>;
type GetEventByIdResponse = Promise<ReturnType<EventsService['getEventById']>>;
type SearchEventsResponse = Promise<ReturnType<EventsService['getBySearch']>>;

@Route('events')
@Tags('Events')
export class EventsController {
  private service = new EventsService(new EventsRepository(db));

  @Get('/')
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  public async getAllPaginated(
    @Queries() query: PaginationQuery,
    @Request() request: express.Request,
  ): Promise<GetEventsPaginatedResponse> {
    return this.service.getAllEventsPaginated({
      pagination: request.pagination!,
    });
  }

  @Get('/search')
  public async getBySearch(
    @Query() query: string,
    @Query() limit?: number,
  ): Promise<SearchEventsResponse> {
    return this.service.getBySearch(query, limit);
  }

  @Get('/{eventId}')
  public async getById(
    @Path() eventId: string,
    @Request() request: express.Request,
  ): Promise<GetEventByIdResponse> {
    return this.service.getEventById(eventId, request.user?.id);
  }
}
