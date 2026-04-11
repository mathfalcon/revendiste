import {sql} from 'kysely';
import {DB} from '@revendiste/shared';
import {Kysely} from 'kysely';
import {BaseRepository} from '../base';
import type {DashboardDateRange} from '~/controllers/admin/dashboard/validation';

export class AdminDashboardRepository extends BaseRepository<AdminDashboardRepository> {
  withTransaction(trx: Kysely<DB>): AdminDashboardRepository {
    return new AdminDashboardRepository(trx);
  }

  async getTicketsMetrics(range: DashboardDateRange) {
    const now = new Date();

    const publishedActiveEvents = await this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listings.id', 'listingTickets.listingId')
      .innerJoin(
        'eventTicketWaves',
        'eventTicketWaves.id',
        'listings.ticketWaveId',
      )
      .innerJoin('events', 'events.id', 'eventTicketWaves.eventId')
      .select(eb => eb.fn.count('listingTickets.id').as('count'))
      .where('listingTickets.deletedAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .where('listings.soldAt', 'is', null)
      .where('events.eventEndDate', '>', now)
      .where('events.status', '=', 'active')
      .where('events.deletedAt', 'is', null)
      .executeTakeFirst();

    let publishedTotalQb = this.db
      .selectFrom('listingTickets')
      .select(eb => eb.fn.count('listingTickets.id').as('count'))
      .where('listingTickets.deletedAt', 'is', null);

    publishedTotalQb =
      range !== null
        ? publishedTotalQb
            .where('listingTickets.createdAt', '>=', range.from)
            .where('listingTickets.createdAt', '<=', range.to)
        : publishedTotalQb;

    const publishedTotal = await publishedTotalQb.executeTakeFirst();

    let soldQb = this.db
      .selectFrom('listingTickets')
      .select(eb => eb.fn.count('listingTickets.id').as('count'))
      .where('listingTickets.deletedAt', 'is', null)
      .where('listingTickets.soldAt', 'is not', null);

    soldQb =
      range !== null
        ? soldQb
            .where('listingTickets.soldAt', '>=', range.from)
            .where('listingTickets.soldAt', '<=', range.to)
        : soldQb;

    const sold = await soldQb.executeTakeFirst();

    const activeListings = await this.db
      .selectFrom('listings')
      .innerJoin(
        'eventTicketWaves',
        'eventTicketWaves.id',
        'listings.ticketWaveId',
      )
      .innerJoin('events', 'events.id', 'eventTicketWaves.eventId')
      .select(eb => eb.fn.count('listings.id').as('count'))
      .where('listings.deletedAt', 'is', null)
      .where('listings.soldAt', 'is', null)
      .where('events.eventEndDate', '>', now)
      .where('events.status', '=', 'active')
      .where('events.deletedAt', 'is', null)
      .executeTakeFirst();

    return {
      publishedActiveEvents: Number(publishedActiveEvents?.count ?? 0),
      publishedTotal: Number(publishedTotal?.count ?? 0),
      sold: Number(sold?.count ?? 0),
      activeListings: Number(activeListings?.count ?? 0),
    };
  }

  async getRevenueByCurrency(range: DashboardDateRange) {
    let qb = this.db
      .selectFrom('orders')
      .innerJoin('payments', join =>
        join
          .onRef('payments.orderId', '=', 'orders.id')
          .on('payments.deletedAt', 'is', null)
          .on('payments.status', '=', 'paid'),
      )
      .select([
        'orders.currency',
        eb =>
          eb.fn.sum<string>(eb.ref('orders.totalAmount')).as('gmv'),
        eb =>
          eb.fn
            .sum<string>(eb.ref('orders.platformCommission'))
            .as('platformCommission'),
        eb =>
          eb.fn
            .sum<string>(eb.ref('orders.vatOnCommission'))
            .as('vatOnCommission'),
        eb =>
          sql<string>`sum(coalesce(${eb.ref('payments.balanceFee')}, 0))`.as(
            'processorFees',
          ),
      ])
      .where('orders.status', '=', 'confirmed')
      .where('orders.deletedAt', 'is', null)
      .groupBy('orders.currency');

    if (range !== null) {
      qb = qb
        .where(
          sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) >= ${range.from}`,
        )
        .where(
          sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) <= ${range.to}`,
        );
    }

    return await qb.execute();
  }

  async getOrdersMetrics(range: DashboardDateRange) {
    const statuses = [
      'pending',
      'confirmed',
      'expired',
      'cancelled',
    ] as const;

    const counts = await Promise.all(
      statuses.map(async status => {
        let rowQb = this.db
          .selectFrom('orders')
          .select(eb => eb.fn.count('orders.id').as('count'))
          .where('orders.status', '=', status)
          .where('orders.deletedAt', 'is', null);

        if (range !== null) {
          rowQb = rowQb
            .where('orders.createdAt', '>=', range.from)
            .where('orders.createdAt', '<=', range.to);
        }

        const row = await rowQb.executeTakeFirst();
        return {status, count: Number(row?.count ?? 0)};
      }),
    );

    const byStatus = Object.fromEntries(
      counts.map(({status, count}) => [status, count]),
    ) as Record<(typeof statuses)[number], number>;

    let paidQb = this.db
      .selectFrom('payments')
      .select(eb => eb.fn.count('payments.id').as('count'))
      .where('payments.status', '=', 'paid')
      .where('payments.deletedAt', 'is', null);

    if (range !== null) {
      paidQb = paidQb
        .where('payments.createdAt', '>=', range.from)
        .where('payments.createdAt', '<=', range.to);
    }

    const paid = await paidQb.executeTakeFirst();

    let failedQb = this.db
      .selectFrom('payments')
      .select(eb => eb.fn.count('payments.id').as('count'))
      .where('payments.status', '=', 'failed')
      .where('payments.deletedAt', 'is', null);

    if (range !== null) {
      failedQb = failedQb
        .where('payments.createdAt', '>=', range.from)
        .where('payments.createdAt', '<=', range.to);
    }

    const failed = await failedQb.executeTakeFirst();

    let expiredQb = this.db
      .selectFrom('payments')
      .select(eb => eb.fn.count('payments.id').as('count'))
      .where('payments.status', '=', 'expired')
      .where('payments.deletedAt', 'is', null);

    if (range !== null) {
      expiredQb = expiredQb
        .where('payments.createdAt', '>=', range.from)
        .where('payments.createdAt', '<=', range.to);
    }

    const expired = await expiredQb.executeTakeFirst();

    return {
      orders: byStatus,
      payments: {
        successful: Number(paid?.count ?? 0),
        failed: Number(failed?.count ?? 0),
        expired: Number(expired?.count ?? 0),
      },
    };
  }

  async getPayoutsMetrics(range: DashboardDateRange) {
    const pendingRows = await this.db
      .selectFrom('payouts')
      .select(eb => [
        eb.fn.count('payouts.id').as('count'),
        eb.fn.sum<string>('payouts.amount').as('amount'),
      ])
      .where('payouts.status', '=', 'pending')
      .where('payouts.deletedAt', 'is', null)
      .executeTakeFirst();

    let completedQb = this.db
      .selectFrom('payouts')
      .select(eb => [
        eb.fn.count('payouts.id').as('count'),
        eb.fn.sum<string>('payouts.amount').as('amount'),
      ])
      .where('payouts.status', '=', 'completed')
      .where('payouts.deletedAt', 'is', null)
      .where('payouts.completedAt', 'is not', null);

    if (range !== null) {
      completedQb = completedQb
        .where('payouts.completedAt', '>=', range.from)
        .where('payouts.completedAt', '<=', range.to);
    }

    const completed = await completedQb.executeTakeFirst();

    const available = await this.db
      .selectFrom('sellerEarnings')
      .select(eb => eb.fn.sum<string>('sellerEarnings.sellerAmount').as('sum'))
      .where('sellerEarnings.status', '=', 'available')
      .where('sellerEarnings.deletedAt', 'is', null)
      .executeTakeFirst();

    const retained = await this.db
      .selectFrom('sellerEarnings')
      .select(eb => eb.fn.sum<string>('sellerEarnings.sellerAmount').as('sum'))
      .where('sellerEarnings.status', '=', 'retained')
      .where('sellerEarnings.deletedAt', 'is', null)
      .executeTakeFirst();

    const currencyRow = await this.db
      .selectFrom('payouts')
      .select('payouts.currency')
      .where('payouts.deletedAt', 'is', null)
      .limit(1)
      .executeTakeFirst();

    return {
      pendingCount: Number(pendingRows?.count ?? 0),
      pendingAmount: pendingRows?.amount ?? '0',
      completedCount: Number(completed?.count ?? 0),
      completedAmount: completed?.amount ?? '0',
      availableEarnings: available?.sum ?? '0',
      retainedEarnings: retained?.sum ?? '0',
      currency: currencyRow?.currency ?? 'UYU',
    };
  }

  async getHealthMetrics() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalUsers = await this.db
      .selectFrom('users')
      .select(eb => eb.fn.count('users.id').as('count'))
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst();

    const newUsers = await this.db
      .selectFrom('users')
      .select(eb => eb.fn.count('users.id').as('count'))
      .where('users.deletedAt', 'is', null)
      .where('users.createdAt', '>=', dayAgo)
      .executeTakeFirst();

    const pendingVerifications = await this.db
      .selectFrom('users')
      .select(eb => eb.fn.count('users.id').as('count'))
      .where('users.deletedAt', 'is', null)
      .where('users.verificationStatus', '=', 'requires_manual_review')
      .executeTakeFirst();

    const openTicketReports = await this.db
      .selectFrom('ticketReports')
      .select(eb => eb.fn.count('ticketReports.id').as('count'))
      .where('ticketReports.status', '!=', 'closed')
      .executeTakeFirst();

    const pendingJobs = await this.db
      .selectFrom('jobs')
      .select(eb => eb.fn.count('jobs.id').as('count'))
      .where('jobs.status', 'in', ['pending', 'processing'])
      .executeTakeFirst();

    const activeEvents = await this.db
      .selectFrom('events')
      .select(eb => eb.fn.count('events.id').as('count'))
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', now)
      .executeTakeFirst();

    return {
      totalUsers: Number(totalUsers?.count ?? 0),
      newUsers: Number(newUsers?.count ?? 0),
      pendingVerifications: Number(pendingVerifications?.count ?? 0),
      openTicketReports: Number(openTicketReports?.count ?? 0),
      pendingJobs: Number(pendingJobs?.count ?? 0),
      activeEvents: Number(activeEvents?.count ?? 0),
    };
  }

  async getTopEvents(range: DashboardDateRange) {
    let topQb = this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listings.id', 'listingTickets.listingId')
      .innerJoin(
        'eventTicketWaves',
        'eventTicketWaves.id',
        'listings.ticketWaveId',
      )
      .innerJoin('events', 'events.id', 'eventTicketWaves.eventId')
      .select([
        'events.id',
        'events.name',
        eb =>
          eb.fn.count('listingTickets.id').as('ticketsSold'),
      ])
      .where('listingTickets.deletedAt', 'is', null)
      .where('listingTickets.soldAt', 'is not', null)
      .groupBy(['events.id', 'events.name'])
      .orderBy('ticketsSold', 'desc')
      .limit(5);

    if (range !== null) {
      topQb = topQb
        .where('listingTickets.soldAt', '>=', range.from)
        .where('listingTickets.soldAt', '<=', range.to);
    }

    const top = await topQb.execute();

    const eventIds = top.map(r => r.id);

    if (eventIds.length === 0) {
      return [];
    }

    let revenueQb = this.db
      .selectFrom('orders')
      .select([
        'orders.eventId',
        eb =>
          eb.fn.sum<string>('orders.totalAmount').as('revenue'),
      ])
      .where('orders.status', '=', 'confirmed')
      .where('orders.deletedAt', 'is', null)
      .where('orders.eventId', 'in', eventIds)
      .groupBy('orders.eventId');

    if (range !== null) {
      revenueQb = revenueQb
        .where(
          sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) >= ${range.from}`,
        )
        .where(
          sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) <= ${range.to}`,
        );
    }

    const revenueRows = await revenueQb.execute();

    const revenueByEvent = new Map(
      revenueRows.map(r => [r.eventId, r.revenue ?? '0']),
    );

    let listingQb = this.db
      .selectFrom('listings')
      .innerJoin(
        'eventTicketWaves',
        'eventTicketWaves.id',
        'listings.ticketWaveId',
      )
      .select([
        'eventTicketWaves.eventId',
        eb => eb.fn.count('listings.id').as('listingCount'),
      ])
      .where('listings.deletedAt', 'is', null)
      .where('eventTicketWaves.eventId', 'in', eventIds)
      .groupBy('eventTicketWaves.eventId');

    if (range !== null) {
      listingQb = listingQb
        .where('listings.createdAt', '>=', range.from)
        .where('listings.createdAt', '<=', range.to);
    }

    const listingCounts = await listingQb.execute();

    const listingByEvent = new Map(
      listingCounts.map(r => [r.eventId, Number(r.listingCount)]),
    );

    return top.map(row => ({
      eventId: row.id,
      eventName: row.name,
      ticketsSold: Number(row.ticketsSold),
      revenue: revenueByEvent.get(row.id) ?? '0',
      listingCount: listingByEvent.get(row.id) ?? 0,
    }));
  }
}
