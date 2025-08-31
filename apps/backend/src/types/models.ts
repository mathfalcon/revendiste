import {Selectable} from 'kysely';
import {TicketListings, Users} from './db';

export type User = Selectable<Users>;

export type TicketListing = Selectable<TicketListings>;
