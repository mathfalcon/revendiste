import type {TicketReports, TicketReportActions, TicketReportRefunds} from '@revendiste/shared';
import type {Selectable} from 'kysely';

let counter = 1;

export function createMockTicketReport(
  overrides: Partial<Selectable<TicketReports>> = {},
): Selectable<TicketReports> {
  const now = new Date();
  return {
    id: `report-${counter++}`,
    status: 'awaiting_support',
    caseType: 'other',
    entityType: 'order',
    entityId: 'entity-1',
    reportedByUserId: 'user-1',
    description: null,
    source: 'user_report',
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockTicketReportAction(
  overrides: Partial<Selectable<TicketReportActions>> = {},
): Selectable<TicketReportActions> {
  const now = new Date();
  return {
    id: `action-${counter++}`,
    ticketReportId: 'report-1',
    performedByUserId: 'user-1',
    performedByAdmin: false,
    actionType: 'comment',
    comment: 'Un comentario de prueba',
    metadata: null,
    createdAt: now,
    ...overrides,
  };
}

export function createMockTicketReportRefund(
  overrides: Partial<Selectable<TicketReportRefunds>> = {},
): Selectable<TicketReportRefunds> {
  const now = new Date();
  return {
    id: `refund-${counter++}`,
    ticketReportId: 'report-1',
    orderTicketReservationId: 'reservation-1',
    refundStatus: 'pending',
    refundAmount: null,
    currency: null,
    processedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
