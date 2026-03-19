import {z} from 'zod';
import type {
  TicketReportStatus,
  TicketReportCaseType,
  TicketReportActionType,
  TicketReportEntityType,
  TicketReportSource,
} from '../types';

// Re-export the DB types so consumers can import from one place
export type {
  TicketReportStatus,
  TicketReportCaseType,
  TicketReportActionType,
  TicketReportEntityType,
  TicketReportSource,
};

export const TicketReportStatusSchema = z.enum([
  'awaiting_support',
  'awaiting_customer',
  'closed',
]);

export const TicketReportCaseTypeSchema = z.enum([
  'invalid_ticket',
  'ticket_not_received',
  'problem_with_seller',
  'other',
]);

export const TicketReportActionTypeSchema = z.enum([
  'refund_partial',
  'refund_full',
  'reject',
  'close',
  'comment',
]);

export const TicketReportEntityTypeSchema = z.enum([
  'order',
  'order_ticket_reservation',
  'listing',
  'listing_ticket',
]);

export const TicketReportSourceSchema = z.enum([
  'user_report',
  'auto_missing_document',
]);

export const CASE_STATUS_LABELS: Record<TicketReportStatus, string> = {
  awaiting_support: 'En espera de soporte Revendiste',
  awaiting_customer: 'En espera del cliente',
  closed: 'Cerrado',
};

export const CASE_TYPE_LABELS: Record<TicketReportCaseType, string> = {
  invalid_ticket: 'Me vendieron una entrada inválida',
  ticket_not_received: 'No recibí mi entrada',
  problem_with_seller: 'Problema con el vendedor',
  other: 'Otro',
};

export const CASE_ACTION_TYPE_LABELS: Record<TicketReportActionType, string> = {
  refund_partial: 'Reembolso parcial',
  refund_full: 'Reembolso total',
  reject: 'Rechazar caso',
  close: 'Cerrar caso',
  comment: 'Agregar comentario',
};
