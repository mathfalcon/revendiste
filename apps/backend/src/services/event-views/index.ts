import {EventViewsRepository} from '~/repositories';

export interface LocationFilter {
  region?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export class EventViewsService {
  constructor(private readonly eventViewsRepository: EventViewsRepository) {}

  /**
   * Track a view for an event (called when user views event detail page)
   */
  async trackView(eventId: string) {
    await this.eventViewsRepository.incrementViewCount(eventId);
  }

  /**
   * Get trending events based on view count in the specified time window
   */
  async getTrendingEvents(
    days: number = 7,
    limit: number = 10,
    locationFilter?: LocationFilter,
  ) {
    return this.eventViewsRepository.getTrendingEvents(
      days,
      limit,
      locationFilter,
    );
  }
}
