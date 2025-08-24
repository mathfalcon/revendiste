import express from 'express';
import {Route, Get, Tags, Middlewares, Request, Queries} from '@tsoa/runtime';
import {EventsService} from '~/services';
import {
  ensurePagination,
  paginationMiddleware,
  PaginationQuery,
} from '~/middleware';
import {EventsRepository} from '~/repositories';
import {db} from '~/db';

@Route('events')
@Tags('Events')
export class EventsController {
  private service = new EventsService(new EventsRepository(db));

  @Get('/')
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  public async getAllPaginated(
    @Queries() query: PaginationQuery,
    @Request() request: express.Request,
  ) {
    return this.service.getAllEventsPaginated({
      pagination: request.pagination!,
    });
  }
}
