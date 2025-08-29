import express from 'express';
import {
  Route,
  Get,
  Tags,
  Middlewares,
  Request,
  Queries,
  Path,
} from '@tsoa/runtime';
import {EventsService} from '~/services';
import {
  ensurePagination,
  paginationMiddleware,
  PaginationQuery,
  requireAuthMiddleware,
} from '~/middleware';
import {EventsRepository} from '~/repositories';
import {db} from '~/db';
import {clerkClient, getAuth} from '@clerk/express';

interface GetEventsPaginatedResponse
  extends ReturnType<EventsService['getAllEventsPaginated']> {}
interface GetEventByIdResponse
  extends ReturnType<EventsService['getEventById']> {}

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

  @Get('/protected')
  @Middlewares(requireAuthMiddleware)
  public async getProtected(@Request() req: express.Request) {
    return req.user;
  }

  @Get('/{eventId}')
  public async getById(@Path() eventId: string): Promise<GetEventByIdResponse> {
    return this.service.getEventById(eventId);
  }
}
