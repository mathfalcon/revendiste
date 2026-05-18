import type {EventProducerMemberRole} from '@revendiste/shared';
import type {NextFunction, Request, Response} from 'express';
import {db} from '~/db';
import {UnauthorizedError, ValidationError} from '~/errors';
import {EVENT_PRODUCER_ERROR_MESSAGES} from '~/constants/error-messages';
import {EventProducerMembersRepository, EventsRepository} from '~/repositories';

type ResolveEventProducerId = (
  req: Request,
) => string | null | Promise<string | null>;

type RequireEventProducerMembershipOptions = {
  allowedRoles?: EventProducerMemberRole[];
};

export function requireEventProducerMembershipMiddleware(
  resolveEventProducerId: ResolveEventProducerId,
  options: RequireEventProducerMembershipOptions = {},
) {
  const membersRepository = new EventProducerMembersRepository(db);

  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const eventProducerId = await resolveEventProducerId(req);
    if (!eventProducerId) {
      throw new ValidationError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_NOT_FOUND,
      );
    }

    const membership =
      await membersRepository.getActiveByEventProducerAndUser(
        eventProducerId,
        req.user.id,
      );

    if (!membership) {
      throw new UnauthorizedError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBERSHIP_REQUIRED,
      );
    }

    if (
      options.allowedRoles &&
      options.allowedRoles.length > 0 &&
      !options.allowedRoles.includes(membership.role)
    ) {
      throw new UnauthorizedError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_ROLE_REQUIRED,
      );
    }

    return next();
  };
}

export function resolveEventProducerIdFromBody(
  fieldName: string = 'eventProducerId',
) {
  return async (req: Request) => {
    const body = req.body as Record<string, unknown> | undefined;
    const value = body?.[fieldName];
    return typeof value === 'string' ? value : null;
  };
}

export function resolveEventProducerIdFromEventParam(
  eventIdParam: string = 'eventId',
) {
  const eventsRepository = new EventsRepository(db);

  return async (req: Request) => {
    const eventId = req.params?.[eventIdParam];
    if (!eventId) {
      return null;
    }

    const event = await eventsRepository.getLifecycleEventById(eventId);
    return event?.eventProducerId ?? null;
  };
}
