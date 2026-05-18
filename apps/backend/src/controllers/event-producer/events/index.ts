import {
  Path,
  Post,
  Request,
  Response,
  Route,
  Tags,
  Middlewares,
} from '@mathfalcon/tsoa-runtime';
import express from 'express';
import {ValidateBody, Body} from '~/decorators';
import {UnauthorizedError, ValidationError} from '~/errors';
import {
  requireAuthMiddleware,
  requireEventProducerMembershipMiddleware,
  resolveEventProducerIdFromBody,
  resolveEventProducerIdFromEventParam,
} from '~/middleware';
import {
  EventProducerMembersRepository,
  EventProducersRepository,
  EventsRepository,
} from '~/repositories';
import {db} from '~/db';
import {ProducerEventsService} from '~/services/producer-events';
import {
  SaveProducerEventDraftRouteBody,
  SaveProducerEventDraftRouteSchema,
} from './validation';

type SaveProducerEventDraftResponse = Awaited<
  ReturnType<ProducerEventsService['saveDraft']>
>;
type SubmitProducerEventForReviewResponse = Awaited<
  ReturnType<ProducerEventsService['submitForReview']>
>;

@Route('event-producer/events')
@Middlewares(requireAuthMiddleware)
@Tags('Event Producer - Events')
export class EventProducerEventsController {
  private service = new ProducerEventsService(
    new EventsRepository(db),
    new EventProducersRepository(db),
    new EventProducerMembersRepository(db),
  );

  @Post('/draft')
  @ValidateBody(SaveProducerEventDraftRouteSchema)
  @Middlewares(
    requireEventProducerMembershipMiddleware(resolveEventProducerIdFromBody(), {
      allowedRoles: ['owner', 'manager'],
    }),
  )
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<ValidationError>(422, 'Validation failed')
  public async saveDraft(
    @Request() request: express.Request,
    @Body() body: SaveProducerEventDraftRouteBody,
  ): Promise<SaveProducerEventDraftResponse> {
    return this.service.saveDraft(request.user.id, body);
  }

  @Post('/{eventId}/submit-for-review')
  @Middlewares(
    requireEventProducerMembershipMiddleware(
      resolveEventProducerIdFromEventParam('eventId'),
      {
        allowedRoles: ['owner', 'manager'],
      },
    ),
  )
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<ValidationError>(422, 'Validation failed')
  public async submitForReview(
    @Path() eventId: string,
    @Request() request: express.Request,
  ): Promise<SubmitProducerEventForReviewResponse> {
    return this.service.submitForReview(request.user.id, eventId);
  }
}
