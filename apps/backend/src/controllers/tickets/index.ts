import express from 'express';
import {
  Get,
  Middlewares,
  Path,
  Request,
  Response,
  Route,
  Tags,
} from '@mathfalcon/tsoa-runtime';
import {db} from '~/db';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {requireAuthMiddleware} from '~/middleware';
import {ListingTicketsRepository, TicketCodesRepository} from '~/repositories';
import {TicketCodesService} from '~/services/ticket-codes';

type IssueTicketCodeResponse = Awaited<
  ReturnType<TicketCodesService['issueDisplayToken']>
>;

@Route('tickets')
@Middlewares(requireAuthMiddleware)
@Tags('Tickets')
export class TicketsController {
  private service = new TicketCodesService(
    new TicketCodesRepository(db),
    new ListingTicketsRepository(db),
  );

  @Get('/{listingTicketId}/code')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Not ticket owner')
  @Response<NotFoundError>(404, 'Ticket not found')
  @Response<ValidationError>(422, 'Ticket does not support rotating code')
  public async issueTicketCode(
    @Path() listingTicketId: string,
    @Request() request: express.Request,
  ): Promise<IssueTicketCodeResponse> {
    return this.service.issueDisplayToken(listingTicketId, request.user.id);
  }
}
