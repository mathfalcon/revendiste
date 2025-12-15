import {Selectable} from 'kysely';
import {
  Listings,
  Users,
  Orders,
  OrderItems,
  ListingTickets,
  OrderTicketReservations,
  Payments,
  PaymentEvents,
  Notifications,
} from '@revendiste/shared';

export type User = Selectable<Users>;

export type Listing = Selectable<Listings>;

export type Order = Selectable<Orders>;

export type OrderItem = Selectable<OrderItems>;

export type ListingTicket = Selectable<ListingTickets>;

export type OrderTicketReservation = Selectable<OrderTicketReservations>;

export type Payment = Selectable<Payments>;

export type PaymentEvent = Selectable<PaymentEvents>;

export type Notification = Selectable<Notifications>;
