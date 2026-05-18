import {type Insertable, type Updateable} from 'kysely';
import type {Events, JsonValue} from '@revendiste/shared';
import {
  EVENT_ERROR_MESSAGES,
  EVENT_LIFECYCLE_ERROR_MESSAGES,
  EVENT_PRODUCER_ERROR_MESSAGES,
} from '~/constants/error-messages';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {
  EventProducerMembersRepository,
  EventProducersRepository,
  EventsRepository,
} from '~/repositories';
import {generateUniqueSlug} from '~/utils';

type SaveDraftInput = {
  eventProducerId: string;
  eventId?: string;
  name?: string;
  description?: string | null;
  eventStartDate?: string;
  eventEndDate?: string;
  externalUrl?: string;
  officialResaleEnabled?: boolean;
  officialResaleMaxMarkupPercent?: number | null;
  draftPayload?: unknown;
};

const REQUIRED_EDITOR_ROLES = new Set(['owner', 'manager']);
const SUBMITTABLE_STATUSES = new Set(['draft', 'rejected']);

export class ProducerEventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventProducersRepository: EventProducersRepository,
    private readonly eventProducerMembersRepository: EventProducerMembersRepository,
  ) {}

  async saveDraft(userId: string, input: SaveDraftInput) {
    await this.requireEditorMembership(input.eventProducerId, userId);
    await this.requireEventProducer(input.eventProducerId);

    if (input.officialResaleMaxMarkupPercent != null) {
      this.validateOfficialResaleMarkup(input.officialResaleMaxMarkupPercent);
    }

    if (input.eventId) {
      const event = await this.getRequiredLifecycleEvent(input.eventId);
      this.assertOfficialOwnership(event, input.eventProducerId);

      if (!SUBMITTABLE_STATUSES.has(event.status)) {
        throw new ValidationError(
          EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_DRAFT_SAVE_STATUS(event.status),
        );
      }

      const nextStartDate = input.eventStartDate
        ? this.parseDate(input.eventStartDate)
        : event.eventStartDate;
      const nextEndDate = input.eventEndDate
        ? this.parseDate(input.eventEndDate)
        : event.eventEndDate;
      this.ensureValidDateWindow(nextStartDate, nextEndDate);

      const updateData = this.buildDraftUpdatePayload(input, event);
      const updated = await this.eventsRepository.updateOfficialDraftEvent(
        input.eventId,
        input.eventProducerId,
        updateData,
      );

      if (!updated) {
        throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
      }

      return updated;
    }

    return await this.createDraftEvent(input);
  }

  async submitForReview(userId: string, eventId: string) {
    const event = await this.getRequiredLifecycleEvent(eventId);

    if (!event.eventProducerId) {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.EVENT_PRODUCER_REQUIRED,
      );
    }

    await this.requireEditorMembership(event.eventProducerId, userId);

    if (!event.isOfficial) {
      throw new ValidationError(EVENT_LIFECYCLE_ERROR_MESSAGES.EVENT_NOT_OFFICIAL);
    }

    if (!SUBMITTABLE_STATUSES.has(event.status)) {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_SUBMIT_TRANSITION(event.status),
      );
    }

    this.validateReviewReadiness(event);

    const submitted = await this.eventsRepository.updateEvent(eventId, {
      status: 'under_review',
      submittedAt: new Date(),
      rejectedReason: null,
    });

    if (!submitted) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return submitted;
  }

  private async createDraftEvent(input: SaveDraftInput) {
    const now = new Date();
    const eventStartDate = input.eventStartDate
      ? this.parseDate(input.eventStartDate)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const eventEndDate = input.eventEndDate
      ? this.parseDate(input.eventEndDate)
      : new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000);

    this.ensureValidDateWindow(eventStartDate, eventEndDate);

    const name = input.name?.trim().length
      ? input.name.trim()
      : 'Borrador oficial';
    const slug = await generateUniqueSlug(name, slug =>
      this.eventsRepository.slugExists(slug),
    );
    const draftIdSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const eventData: Insertable<Events> = {
      externalId: `official-draft-${input.eventProducerId}-${draftIdSuffix}`,
      platform: 'official_internal',
      name,
      description: input.description ?? null,
      eventStartDate,
      eventEndDate,
      venueId: null,
      externalUrl: input.externalUrl ?? '',
      qrAvailabilityTiming: null,
      status: 'draft',
      slug,
      metadata: null,
      createdAt: now,
      updatedAt: now,
      lastScrapedAt: now,
      eventProducerId: input.eventProducerId,
      isOfficial: true,
      officialResaleEnabled: input.officialResaleEnabled ?? false,
      officialResaleMaxMarkupPercent:
        input.officialResaleMaxMarkupPercent ?? null,
      draftPayload: this.normalizeDraftPayload(input.draftPayload) ?? null,
      submittedAt: null,
      approvedAt: null,
      approvedByUserId: null,
      rejectedReason: null,
    };

    return await this.eventsRepository.createEvent(eventData);
  }

  private buildDraftUpdatePayload(
    input: SaveDraftInput,
    event: Awaited<ReturnType<EventsRepository['getLifecycleEventById']>>,
  ) {
    const payload: Updateable<Events> = {};

    const nextDraftPayload =
      input.draftPayload !== undefined
        ? this.normalizeDraftPayload(input.draftPayload)
        : event?.draftPayload;

    if (nextDraftPayload !== undefined) {
      payload.draftPayload = nextDraftPayload;
    }

    if (input.name !== undefined) {
      payload.name = input.name.trim();
    }

    if (input.description !== undefined) {
      payload.description = input.description;
    }

    if (input.eventStartDate !== undefined) {
      payload.eventStartDate = this.parseDate(input.eventStartDate);
    }

    if (input.eventEndDate !== undefined) {
      payload.eventEndDate = this.parseDate(input.eventEndDate);
    }

    if (input.externalUrl !== undefined) {
      payload.externalUrl = input.externalUrl;
    }

    if (input.officialResaleEnabled !== undefined) {
      payload.officialResaleEnabled = input.officialResaleEnabled;
    }

    if (input.officialResaleMaxMarkupPercent !== undefined) {
      payload.officialResaleMaxMarkupPercent =
        input.officialResaleMaxMarkupPercent;
    }

    return payload;
  }

  private validateReviewReadiness(
    event: Awaited<ReturnType<EventsRepository['getLifecycleEventById']>>,
  ) {
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    if (!event.name?.trim() || !event.draftPayload) {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.REVIEW_FIELDS_INCOMPLETE,
      );
    }

    this.ensureValidDateWindow(event.eventStartDate, event.eventEndDate);
  }

  private async getRequiredLifecycleEvent(eventId: string) {
    const event = await this.eventsRepository.getLifecycleEventById(eventId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return event;
  }

  private assertOfficialOwnership(
    event: Awaited<ReturnType<EventsRepository['getLifecycleEventById']>>,
    eventProducerId: string,
  ) {
    if (!event?.isOfficial) {
      throw new ValidationError(EVENT_LIFECYCLE_ERROR_MESSAGES.EVENT_NOT_OFFICIAL);
    }

    if (!event.eventProducerId || event.eventProducerId !== eventProducerId) {
      throw new UnauthorizedError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBERSHIP_REQUIRED,
      );
    }
  }

  private async requireEventProducer(eventProducerId: string) {
    const eventProducer =
      await this.eventProducersRepository.getById(eventProducerId);
    if (!eventProducer) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_NOT_FOUND,
      );
    }
    return eventProducer;
  }

  private async requireEditorMembership(eventProducerId: string, userId: string) {
    const membership =
      await this.eventProducerMembersRepository.getActiveByEventProducerAndUser(
        eventProducerId,
        userId,
      );

    if (!membership) {
      throw new UnauthorizedError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBERSHIP_REQUIRED,
      );
    }

    if (!REQUIRED_EDITOR_ROLES.has(membership.role)) {
      throw new UnauthorizedError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_ROLE_REQUIRED,
      );
    }

    return membership;
  }

  private validateOfficialResaleMarkup(value: number) {
    if (value < 110) {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.OFFICIAL_RESALE_MARKUP_MINIMUM,
      );
    }
  }

  private parseDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError(EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_EVENT_DATES);
    }
    return parsed;
  }

  private ensureValidDateWindow(startDate: Date, endDate: Date) {
    if (endDate.getTime() <= startDate.getTime()) {
      throw new ValidationError(EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_EVENT_DATES);
    }
  }

  private normalizeDraftPayload(payload: unknown): JsonValue | null | undefined {
    if (payload === undefined) {
      return undefined;
    }

    if (payload === null) {
      return null;
    }

    if (!this.isJsonValue(payload)) {
      throw new ValidationError(EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_DRAFT_PAYLOAD);
    }

    return payload;
  }

  private isJsonValue(value: unknown): value is JsonValue {
    if (value === null) {
      return true;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(item => this.isJsonValue(item));
    }

    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).every(item =>
        this.isJsonValue(item),
      );
    }

    return false;
  }
}
