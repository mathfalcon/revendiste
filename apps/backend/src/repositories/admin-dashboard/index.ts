import {sql} from 'kysely';
import {DB} from '@revendiste/shared';
import {Kysely} from 'kysely';
import {BaseRepository} from '../base';
import {
  type DashboardDateRange,
  resolveDashboardTimeSeriesRange,
} from '~/controllers/admin/dashboard/validation';

/**
 * Dashboard platform revenue (commission + VAT on commission) is derived from `invoices`
 * with status `issued`, not from `orders.platformCommission` / `orders.vatOnCommission`.
 * Those order columns only reflect the buyer-side fee; seller-side fees are invoiced separately.
 * Amounts are converted with `payments.exchangeRate` when set (same rules as GMV).
 */

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

  /**
   * Revenue grouped by processor settlement currency (`payments.balanceCurrency`).
   * GMV is converted with `payments.exchangeRate` when set.
   * Platform revenue uses issued invoices per order (see module comment).
   */
  async getRevenueByCurrency(range: DashboardDateRange) {
    let qb = this.db
      .selectFrom('orders')
      .innerJoin('payments', join =>
        join
          .onRef('payments.orderId', '=', 'orders.id')
          .on('payments.deletedAt', 'is', null)
          .on('payments.status', '=', 'paid')
          .on('payments.balanceCurrency', 'is not', null),
      )
      .select(eb => [
        eb.ref('payments.balanceCurrency').as('currency'),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then (cast(${eb.ref('orders.totalAmount')} as numeric) * cast(${eb.ref('payments.exchangeRate')} as numeric)) else cast(${eb.ref('orders.totalAmount')} as numeric) end)`.as(
          'gmv',
        ),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then (
          select coalesce(sum(cast(i.base_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) * cast(${eb.ref('payments.exchangeRate')} as numeric) else (
          select coalesce(sum(cast(i.base_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) end)`.as('platformRevenue'),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then (
          select coalesce(sum(cast(i.vat_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) * cast(${eb.ref('payments.exchangeRate')} as numeric) else (
          select coalesce(sum(cast(i.vat_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) end)`.as('vatOnRevenue'),
        sql<string>`sum(coalesce(cast(${eb.ref('payments.balanceFee')} as numeric), 0))`.as(
          'processorFees',
        ),
      ])
      .where('orders.status', '=', 'confirmed')
      .where('orders.deletedAt', 'is', null)
      .groupBy('payments.balanceCurrency');

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

  /**
   * Per-party invoice totals in settlement units (same FX rules as `getRevenueByCurrency`).
   * Grouped by `payments.balanceCurrency` and `invoices.party` so callers can merge when a single settlement currency applies.
   */
  async getRevenuePartyBreakdownSettlement(range: DashboardDateRange) {
    let qb = this.db
      .selectFrom('invoices')
      .innerJoin('orders', join =>
        join
          .onRef('orders.id', '=', 'invoices.orderId')
          .on('orders.status', '=', 'confirmed')
          .on('orders.deletedAt', 'is', null),
      )
      .innerJoin('payments', join =>
        join
          .onRef('payments.orderId', '=', 'orders.id')
          .on('payments.deletedAt', 'is', null)
          .on('payments.status', '=', 'paid')
          .on('payments.balanceCurrency', 'is not', null),
      )
      .select(eb => [
        eb.ref('payments.balanceCurrency').as('currency'),
        eb.ref('invoices.party').as('party'),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then cast(${eb.ref('invoices.baseAmount')} as numeric) * cast(${eb.ref('payments.exchangeRate')} as numeric) else cast(${eb.ref('invoices.baseAmount')} as numeric) end)`.as(
          'platformRevenue',
        ),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then cast(${eb.ref('invoices.vatAmount')} as numeric) * cast(${eb.ref('payments.exchangeRate')} as numeric) else cast(${eb.ref('invoices.vatAmount')} as numeric) end)`.as(
          'vatOnRevenue',
        ),
      ])
      .where('invoices.status', '=', 'issued')
      .groupBy(['payments.balanceCurrency', 'invoices.party']);

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

  /**
   * Confirmed + paid orders where we expect buyer commission on the order but have no issued invoice revenue yet (FEU lag / failures).
   */
  async countOrdersMissingIssuedInvoices(range: DashboardDateRange) {
    let qb = this.db
      .selectFrom('orders')
      .innerJoin('payments', join =>
        join
          .onRef('payments.orderId', '=', 'orders.id')
          .on('payments.deletedAt', 'is', null)
          .on('payments.status', '=', 'paid')
          .on('payments.balanceCurrency', 'is not', null),
      )
      .select(sql<number>`count(distinct orders.id)`.as('count'))
      .where('orders.status', '=', 'confirmed')
      .where('orders.deletedAt', 'is', null)
      .where(
        eb =>
          sql<boolean>`cast(${eb.ref('orders.platformCommission')} as numeric) > 0`,
      )
      .where(
        eb =>
          sql<boolean>`coalesce((
          select sum(cast(i.base_amount as numeric)) from invoices i
          where i.order_id = ${eb.ref('orders.id')} and i.status = 'issued'
        ), 0) = 0`,
      );

    if (range !== null) {
      qb = qb
        .where(
          sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) >= ${range.from}`,
        )
        .where(
          sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) <= ${range.to}`,
        );
    }

    const row = await qb.executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  /**
   * Revenue grouped by order charge currency (`orders.currency`).
   * Amounts are in the order's native currency — no exchange-rate conversion.
   * Useful for showing how much GMV/commission came in each charge currency.
   */
  async getRevenueByOrderCurrency(range: DashboardDateRange) {
    let qb = this.db
      .selectFrom('orders')
      .innerJoin('payments', join =>
        join
          .onRef('payments.orderId', '=', 'orders.id')
          .on('payments.deletedAt', 'is', null)
          .on('payments.status', '=', 'paid'),
      )
      .select(eb => [
        eb.ref('orders.currency').as('currency'),
        eb.fn.sum<string>('orders.totalAmount').as('gmv'),
        sql<string>`sum((
          select coalesce(sum(cast(i.base_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ))`.as('platformRevenue'),
        sql<string>`sum((
          select coalesce(sum(cast(i.vat_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ))`.as('vatOnRevenue'),
        eb.fn.count<number>('orders.id').as('orderCount'),
      ])
      .where('orders.status', '=', 'confirmed')
      .where('orders.deletedAt', 'is', null)
      .groupBy('orders.currency')
      .orderBy('gmv', 'desc');

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

  /**
   * Daily revenue for confirmed+paid orders (same settlement-currency logic as getRevenueByCurrency).
   * When `range` is null (all-time), uses the last 365 days to bound chart payload size.
   */
  async getRevenueTimeSeries(range: DashboardDateRange) {
    const effectiveRange = resolveDashboardTimeSeriesRange(range);

    const dayBucket = sql<Date>`date_trunc('day', coalesce(orders.confirmed_at, orders.created_at))::date`;

    let qb = this.db
      .selectFrom('orders')
      .innerJoin('payments', join =>
        join
          .onRef('payments.orderId', '=', 'orders.id')
          .on('payments.deletedAt', 'is', null)
          .on('payments.status', '=', 'paid')
          .on('payments.balanceCurrency', 'is not', null),
      )
      .select(eb => [
        dayBucket.as('day'),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then (cast(${eb.ref('orders.totalAmount')} as numeric) * cast(${eb.ref('payments.exchangeRate')} as numeric)) else cast(${eb.ref('orders.totalAmount')} as numeric) end)`.as(
          'gmv',
        ),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then (
          select coalesce(sum(cast(i.base_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) * cast(${eb.ref('payments.exchangeRate')} as numeric) else (
          select coalesce(sum(cast(i.base_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) end)`.as('platformRevenue'),
        sql<string>`sum(case when ${eb.ref('payments.exchangeRate')} is not null then (
          select coalesce(sum(cast(i.vat_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) * cast(${eb.ref('payments.exchangeRate')} as numeric) else (
          select coalesce(sum(cast(i.vat_amount as numeric)), 0) from invoices i
          where i.order_id = orders.id and i.status = 'issued'
        ) end)`.as('vatOnRevenue'),
        sql<string>`sum(coalesce(cast(${eb.ref('payments.balanceFee')} as numeric), 0))`.as(
          'processorFees',
        ),
      ])
      .where('orders.status', '=', 'confirmed')
      .where('orders.deletedAt', 'is', null)
      .where(
        sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) >= ${effectiveRange.from}`,
      )
      .where(
        sql<boolean>`coalesce(orders.confirmed_at, orders.created_at) <= ${effectiveRange.to}`,
      )
      .groupBy(dayBucket)
      .orderBy('day', 'asc');

    return await qb.execute();
  }

  /**
   * Daily order counts by status (bucket = order createdAt).
   * When `range` is null, uses the last 365 days.
   */
  async getOrdersTimeSeries(range: DashboardDateRange) {
    const effectiveRange = resolveDashboardTimeSeriesRange(range);

    const dayBucket = sql<Date>`date_trunc('day', orders.created_at)::date`;

    return await this.db
      .selectFrom('orders')
      .select(eb => [
        dayBucket.as('day'),
        eb.fn.count<number>('orders.id').as('total'),
        sql<number>`count(*) filter (where orders.status = 'confirmed')`.as(
          'confirmed',
        ),
        sql<number>`count(*) filter (where orders.status = 'pending')`.as(
          'pending',
        ),
        sql<number>`count(*) filter (where orders.status = 'expired')`.as(
          'expired',
        ),
        sql<number>`count(*) filter (where orders.status = 'cancelled')`.as(
          'cancelled',
        ),
      ])
      .where('orders.deletedAt', 'is', null)
      .where('orders.createdAt', '>=', effectiveRange.from)
      .where('orders.createdAt', '<=', effectiveRange.to)
      .groupBy(dayBucket)
      .orderBy('day', 'asc')
      .execute();
  }

  /**
   * Published tickets per day (createdAt) and sold tickets per day (soldAt).
   * When `range` is null, uses the last 365 days for each query.
   */
  async getTicketsPublishedTimeSeries(range: DashboardDateRange) {
    const effectiveRange = resolveDashboardTimeSeriesRange(range);

    const dayBucket = sql<Date>`date_trunc('day', listing_tickets.created_at)::date`;

    return await this.db
      .selectFrom('listingTickets')
      .select(eb => [
        dayBucket.as('day'),
        eb.fn.count<number>('listingTickets.id').as('published'),
      ])
      .where('listingTickets.deletedAt', 'is', null)
      .where('listingTickets.createdAt', '>=', effectiveRange.from)
      .where('listingTickets.createdAt', '<=', effectiveRange.to)
      .groupBy(dayBucket)
      .orderBy('day', 'asc')
      .execute();
  }

  async getTicketsSoldTimeSeries(range: DashboardDateRange) {
    const effectiveRange = resolveDashboardTimeSeriesRange(range);

    const dayBucket = sql<Date>`date_trunc('day', listing_tickets.sold_at)::date`;

    return await this.db
      .selectFrom('listingTickets')
      .select(eb => [
        dayBucket.as('day'),
        eb.fn.count<number>('listingTickets.id').as('sold'),
      ])
      .where('listingTickets.deletedAt', 'is', null)
      .where('listingTickets.soldAt', 'is not', null)
      .where('listingTickets.soldAt', '>=', effectiveRange.from)
      .where('listingTickets.soldAt', '<=', effectiveRange.to)
      .groupBy(dayBucket)
      .orderBy('day', 'asc')
      .execute();
  }

  async getOrdersMetrics(range: DashboardDateRange) {
    const statuses = ['pending', 'confirmed', 'expired', 'cancelled'] as const;

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

  async getSidebarCounts() {
    const [verifications, payouts, reports] = await Promise.all([
      this.db
        .selectFrom('users')
        .select(eb => eb.fn.count('users.id').as('count'))
        .where('users.deletedAt', 'is', null)
        .where('users.verificationStatus', '=', 'requires_manual_review')
        .executeTakeFirst(),
      this.db
        .selectFrom('payouts')
        .select(eb => eb.fn.count('payouts.id').as('count'))
        .where('payouts.status', '=', 'pending')
        .where('payouts.deletedAt', 'is', null)
        .executeTakeFirst(),
      this.db
        .selectFrom('ticketReports')
        .select(eb => eb.fn.count('ticketReports.id').as('count'))
        .where('ticketReports.status', '=', 'awaiting_support')
        .executeTakeFirst(),
    ]);

    return {
      pendingVerifications: Number(verifications?.count ?? 0),
      pendingPayouts: Number(payouts?.count ?? 0),
      reportsAwaitingResponse: Number(reports?.count ?? 0),
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
        eb => eb.fn.count('listingTickets.id').as('ticketsSold'),
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
        eb => eb.fn.sum<string>('orders.totalAmount').as('revenue'),
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
