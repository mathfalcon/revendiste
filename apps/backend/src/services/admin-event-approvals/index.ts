import {
  EVENT_ERROR_MESSAGES,
  EVENT_LIFECYCLE_ERROR_MESSAGES,
} from '~/constants/error-messages';
import {NotFoundError, ValidationError} from '~/errors';
import {OfficialWaveStockMaterializer} from '~/services/producer-events/stock-materializer';
import {EventsRepository} from '~/repositories';

export class AdminEventApprovalsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly stockMaterializer: OfficialWaveStockMaterializer,
  ) {}

  async approveEvent(eventId: string, adminUserId: string) {
    const event = await this.getRequiredEvent(eventId);

    if (event.status !== 'under_review') {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_APPROVAL_TRANSITION(event.status),
      );
    }

    const approved = await this.eventsRepository.updateEvent(eventId, {
      status: 'published',
      approvedAt: new Date(),
      approvedByUserId: adminUserId,
      rejectedReason: null,
    });

    if (!approved) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    if (approved.isOfficial) {
      await this.stockMaterializer.materializePublishedEventWaves(eventId);
    }

    return approved;
  }

  async rejectEvent(eventId: string, rejectedReason: string) {
    if (!rejectedReason.trim()) {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.REJECTION_REASON_REQUIRED,
      );
    }

    const event = await this.getRequiredEvent(eventId);

    if (event.status !== 'under_review') {
      throw new ValidationError(
        EVENT_LIFECYCLE_ERROR_MESSAGES.INVALID_REJECTION_TRANSITION(event.status),
      );
    }

    const rejected = await this.eventsRepository.updateEvent(eventId, {
      status: 'rejected',
      rejectedReason: rejectedReason.trim(),
      approvedAt: null,
      approvedByUserId: null,
    });

    if (!rejected) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return rejected;
  }

  private async getRequiredEvent(eventId: string) {
    const event = await this.eventsRepository.getLifecycleEventById(eventId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return event;
  }
}
