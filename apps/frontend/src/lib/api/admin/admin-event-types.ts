import type {GetEventDetailsResponse, GetEventsResponse} from '../generated';

/** Row type from admin `GET /admin/events` list */
export type AdminEvent = GetEventsResponse['data'][number];

/** Admin `GET /admin/events/{eventId}` detail */
export type AdminEventDetail = GetEventDetailsResponse;
