import path from 'node:path';
import {readdirSync} from 'node:fs';
import {CamelCasePlugin, Kysely, PostgresDialect} from 'kysely';
import {Client, Pool} from 'pg';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrderItemsRepository,
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
} from '~/repositories';
import {OrdersService} from '~/services/orders';
import {ORDER_ERROR_MESSAGES} from '~/constants/error-messages';

const MIGRATIONS_DIRECTORY = path.resolve(
  __dirname,
  '..',
  '..',
  'db',
  'migrations',
);

type MigrationModule = {
  up: (db: Kysely<any>) => Promise<void>;
};

async function applyMigrations(db: Kysely<any>): Promise<void> {
  const migrationFiles = readdirSync(MIGRATIONS_DIRECTORY)
    .filter(file => /^\d+_.*\.ts$/.test(file))
    .sort((a, b) => a.localeCompare(b));

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(MIGRATIONS_DIRECTORY, migrationFile);
    const migrationModule = (await import(migrationPath)) as MigrationModule;

    if (typeof migrationModule.up !== 'function') {
      throw new Error(`Migration ${migrationFile} does not export an up() function`);
    }

    await migrationModule.up(db);
  }
}

async function seedReservationConflictFixture(connectionString: string) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const client = new Client({connectionString});
  await client.connect();

  try {
    const sellerResult = await client.query<{id: string}>(
      `
        INSERT INTO users (clerk_id, email)
        VALUES ($1, $2)
        RETURNING id
      `,
      [`seller-${suffix}`, `seller-${suffix}@example.com`],
    );
    const sellerUserId = sellerResult.rows[0]!.id;

    const buyerResult = await client.query<{id: string}>(
      `
        INSERT INTO users (clerk_id, email)
        VALUES ($1, $2)
        RETURNING id
      `,
      [`buyer-${suffix}`, `buyer-${suffix}@example.com`],
    );
    const buyerUserId = buyerResult.rows[0]!.id;

    const eventResult = await client.query<{id: string}>(
      `
        INSERT INTO events (
          external_id,
          platform,
          name,
          event_start_date,
          event_end_date,
          external_url,
          slug
        )
        VALUES ($1, 'entraste', $2, NOW() + interval '2 day', NOW() + interval '3 day', $3, $4)
        RETURNING id
      `,
      [
        `event-${suffix}`,
        `Evento ${suffix}`,
        `https://example.com/events/${suffix}`,
        `evento-${suffix}`,
      ],
    );
    const eventId = eventResult.rows[0]!.id;

    const waveResult = await client.query<{id: string}>(
      `
        INSERT INTO event_ticket_waves (event_id, external_id, name, face_value, currency)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [eventId, `wave-${suffix}`, `General ${suffix}`, 1500, 'UYU'],
    );
    const ticketWaveId = waveResult.rows[0]!.id;

    const listingResult = await client.query<{id: string}>(
      `
        INSERT INTO listings (ticket_wave_id, publisher_user_id, publisher_event_producer_id)
        VALUES ($1, $2, NULL)
        RETURNING id
      `,
      [ticketWaveId, sellerUserId],
    );
    const listingId = listingResult.rows[0]!.id;

    const listingTicketResult = await client.query<{id: string}>(
      `
        INSERT INTO listing_tickets (listing_id, ticket_number, price)
        VALUES ($1, 1, 1500)
        RETURNING id
      `,
      [listingId],
    );
    const listingTicketId = listingTicketResult.rows[0]!.id;

    const existingOrderResult = await client.query<{id: string}>(
      `
        INSERT INTO orders (
          user_id,
          event_id,
          status,
          total_amount,
          subtotal_amount,
          platform_commission,
          vat_on_commission,
          currency,
          reservation_expires_at,
          cancelled_at
        )
        VALUES ($1, $2, 'cancelled', 1500, 1500, 0, 0, 'UYU', NOW() + interval '10 minute', NOW())
        RETURNING id
      `,
      [sellerUserId, eventId],
    );
    const existingOrderId = existingOrderResult.rows[0]!.id;

    await client.query(
      `
        INSERT INTO order_ticket_reservations (order_id, listing_ticket_id, reserved_until)
        VALUES ($1, $2, NOW() + interval '10 minute')
      `,
      [existingOrderId, listingTicketId],
    );

    return {buyerUserId, eventId, ticketWaveId};
  } finally {
    await client.end().catch(() => undefined);
  }
}

describe('Orders reservation conflict integration', () => {
  let container: StartedPostgreSqlContainer | null = null;
  let db: Kysely<any> | null = null;
  let connectionString = '';

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('revendiste_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    connectionString = container.getConnectionUri();

    db = new Kysely<any>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString,
        }),
      }),
      plugins: [new CamelCasePlugin()],
    });

    await applyMigrations(db);
  }, 180000);

  afterAll(async () => {
    await db?.destroy().catch(() => undefined);
    await container?.stop().catch(() => undefined);
  });

  it(
    'maps the active-reservation unique index collision to a user-facing availability error',
    async () => {
      if (!db) {
        throw new Error('Database is not initialized');
      }

      const fixture = await seedReservationConflictFixture(connectionString);

      const ordersRepository = new OrdersRepository(db);
      const orderItemsRepository = new OrderItemsRepository(db);
      const eventsRepository = new EventsRepository(db);
      const eventTicketWavesRepository = new EventTicketWavesRepository(db);
      const listingTicketsRepository = new ListingTicketsRepository(db);
      const orderTicketReservationsRepository = new OrderTicketReservationsRepository(
        db,
      );
      const paymentsRepository = new PaymentsRepository(db);

      const paymentSyncService = {
        syncPendingOrderPayment: jest.fn().mockResolvedValue(undefined),
      };
      const notificationService = {
        createNotification: jest.fn().mockResolvedValue(undefined),
      };

      const service = new OrdersService(
        ordersRepository,
        orderItemsRepository,
        eventsRepository,
        eventTicketWavesRepository,
        listingTicketsRepository,
        orderTicketReservationsRepository,
        paymentSyncService as any,
        paymentsRepository,
        notificationService as any,
      );

      const requestBody = {
        eventId: fixture.eventId,
        ticketSelections: {
          [fixture.ticketWaveId]: {'1500': 1},
        },
      };

      await expect(
        service.createOrder(requestBody, fixture.buyerUserId),
      ).rejects.toMatchObject({
        message: ORDER_ERROR_MESSAGES.TICKETS_NO_LONGER_AVAILABLE,
      });
    },
    30000,
  );
});
