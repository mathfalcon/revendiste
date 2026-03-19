import {Kysely, sql} from 'kysely';
import {jsonArrayFrom} from 'kysely/helpers/postgres';
import {DB} from '@revendiste/shared';
import type {
  TicketReportStatus,
  TicketReportCaseType,
  TicketReportEntityType,
  TicketReportSource,
} from '@revendiste/shared';
import {BaseRepository} from '../base';
import type {PaginationOptions} from '~/types/pagination';
import {createPaginatedResponse} from '~/middleware/pagination';

export class TicketReportsRepository extends BaseRepository<TicketReportsRepository> {
  withTransaction(trx: Kysely<DB>): TicketReportsRepository {
    return new TicketReportsRepository(trx);
  }

  async create(data: {
    status: 'awaiting_support';
    caseType: TicketReportCaseType;
    entityType: TicketReportEntityType;
    entityId: string;
    reportedByUserId?: string | null;
    description?: string | null;
    source?: TicketReportSource;
  }) {
    return await this.db
      .insertInto('ticketReports')
      .values({
        status: data.status,
        caseType: data.caseType,
        entityType: data.entityType,
        entityId: data.entityId,
        reportedByUserId: data.reportedByUserId ?? null,
        description: data.description ?? null,
        source: data.source ?? 'user_report',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getById(id: string) {
    return await this.db
      .selectFrom('ticketReports')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async getByIdWithActions(id: string) {
    return await this.db
      .selectFrom('ticketReports')
      .selectAll()
      .select(eb => [
        jsonArrayFrom(
          eb
            .selectFrom('ticketReportActions')
            .selectAll()
            .whereRef('ticketReportActions.ticketReportId', '=', 'ticketReports.id')
            .orderBy('ticketReportActions.createdAt', 'asc'),
        ).as('actions'),
      ])
      .where('ticketReports.id', '=', id)
      .executeTakeFirst();
  }

  async getEntityDetails(entityType: string, entityId: string) {
    switch (entityType) {
      case 'order_ticket_reservation': {
        return await this.db
          .selectFrom('orderTicketReservations as r')
          .innerJoin('listingTickets as lt', 'lt.id', 'r.listingTicketId')
          .leftJoin('listings as l', 'l.id', 'lt.listingId')
          .leftJoin('orders as o', 'o.id', 'r.orderId')
          .leftJoin('events as e', 'e.id', 'o.eventId')
          .leftJoin('eventTicketWaves as tw', 'tw.id', 'l.ticketWaveId')
          .select(eb => [
            'r.id as reservationId',
            'r.status as reservationStatus',
            'lt.price',
            'o.id as orderId',
            'o.currency',
            'e.id as eventId',
            'e.name as eventName',
            'e.eventStartDate',
            'tw.name as ticketWaveName',
          ])
          .where('lt.id', '=', entityId)
          .executeTakeFirst();
      }
      case 'order': {
        return await this.db
          .selectFrom('orders as o')
          .leftJoin('events as e', 'e.id', 'o.eventId')
          .select([
            'o.id as orderId',
            'o.totalAmount',
            'o.currency',
            'o.status as orderStatus',
            'e.id as eventId',
            'e.name as eventName',
            'e.eventStartDate',
          ])
          .where('o.id', '=', entityId)
          .executeTakeFirst();
      }
      case 'listing': {
        return await this.db
          .selectFrom('listings as l')
          .leftJoin('eventTicketWaves as tw', 'tw.id', 'l.ticketWaveId')
          .leftJoin('events as e', 'e.id', 'tw.eventId')
          .select(eb => [
            'l.id as listingId',
            'e.id as eventId',
            'e.name as eventName',
            'e.eventStartDate',
          ])
          .where('l.id', '=', entityId)
          .executeTakeFirst();
      }
      case 'listing_ticket': {
        return await this.db
          .selectFrom('listingTickets as lt')
          .leftJoin('listings as l', 'l.id', 'lt.listingId')
          .leftJoin('eventTicketWaves as tw', 'tw.id', 'l.ticketWaveId')
          .leftJoin('events as e', 'e.id', 'tw.eventId')
          .select(eb => [
            'lt.id as listingTicketId',
            'lt.price',
            'l.id as listingId',
            'e.id as eventId',
            'e.name as eventName',
            'e.eventStartDate',
            'tw.name as ticketWaveName',
          ])
          .where('lt.id', '=', entityId)
          .executeTakeFirst();
      }
      default:
        return null;
    }
  }

  async getByUserId(userId: string, pagination: PaginationOptions) {
    const [data, countResult] = await Promise.all([
      this.db
        .selectFrom('ticketReports')
        .selectAll()
        .where('reportedByUserId', '=', userId)
        .orderBy('createdAt', pagination.sortOrder)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom('ticketReports')
        .select(eb => eb.fn.countAll<string>().as('count'))
        .where('reportedByUserId', '=', userId)
        .executeTakeFirstOrThrow(),
    ]);

    return createPaginatedResponse(data, parseInt(countResult.count), pagination);
  }

  async getForAdmin(
    filters: {status?: TicketReportStatus; caseType?: TicketReportCaseType},
    pagination: PaginationOptions,
  ) {
    let baseQuery = this.db
      .selectFrom('ticketReports')
      .leftJoin('users', 'users.id', 'ticketReports.reportedByUserId')
      .select([
        'ticketReports.id',
        'ticketReports.status',
        'ticketReports.caseType',
        'ticketReports.entityType',
        'ticketReports.entityId',
        'ticketReports.reportedByUserId',
        'ticketReports.description',
        'ticketReports.source',
        'ticketReports.closedAt',
        'ticketReports.createdAt',
        'ticketReports.updatedAt',
        'users.email as reporterEmail',
        'users.firstName as reporterFirstName',
        'users.lastName as reporterLastName',
      ]);

    if (filters.status) {
      baseQuery = baseQuery.where('ticketReports.status', '=', filters.status);
    }
    if (filters.caseType) {
      baseQuery = baseQuery.where(
        'ticketReports.caseType',
        '=',
        filters.caseType,
      );
    }

    const [data, countResult] = await Promise.all([
      baseQuery
        .orderBy(
          `ticketReports.${pagination.sortBy}` as never,
          pagination.sortOrder,
        )
        .limit(pagination.limit)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom('ticketReports')
        .$if(!!filters.status, qb =>
          qb.where('status', '=', filters.status!),
        )
        .$if(!!filters.caseType, qb =>
          qb.where('caseType', '=', filters.caseType!),
        )
        .select(eb => eb.fn.countAll<string>().as('count'))
        .executeTakeFirstOrThrow(),
    ]);

    return createPaginatedResponse(data, parseInt(countResult.count), pagination);
  }

  async updateStatus(
    id: string,
    status: TicketReportStatus,
    closedAt?: Date | null,
  ) {
    return await this.db
      .updateTable('ticketReports')
      .set({
        status,
        updatedAt: sql`now()`,
        ...(closedAt !== undefined ? {closedAt} : {}),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findActiveByEntity(entityType: TicketReportEntityType, entityId: string) {
    return await this.db
      .selectFrom('ticketReports')
      .selectAll()
      .where('entityType', '=', entityType)
      .where('entityId', '=', entityId)
      .where('status', '!=', 'closed')
      .executeTakeFirst();
  }
}
