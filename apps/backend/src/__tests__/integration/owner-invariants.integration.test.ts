import path from 'node:path';
import {readdirSync} from 'node:fs';
import {CamelCasePlugin, Kysely, PostgresDialect} from 'kysely';
import {Client, Pool} from 'pg';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

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

async function withRollbackTransaction(
  connectionString: string,
  callback: (client: Client) => Promise<void>,
) {
  const client = new Client({connectionString});
  await client.connect();

  try {
    await client.query('BEGIN');
    await callback(client);
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}

async function createFixture(client: Client, suffix: string) {
  const userResult = await client.query<{id: string}>(
    `
      INSERT INTO users (clerk_id, email)
      VALUES ($1, $2)
      RETURNING id
    `,
    [`clerk-owner-${suffix}`, `owner-${suffix}@example.com`],
  );
  const userId = userResult.rows[0]!.id;

  const producerResult = await client.query<{id: string}>(
    `
      INSERT INTO event_producers (name, slug)
      VALUES ($1, $2)
      RETURNING id
    `,
    [`Producer ${suffix}`, `producer-${suffix}`],
  );
  const producerId = producerResult.rows[0]!.id;

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
      VALUES ($1, $2, $3, NOW() + interval '2 day', NOW() + interval '3 day', $4, $5)
      RETURNING id
    `,
    [
      `event-${suffix}`,
      'entraste',
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

  const payoutMethodResult = await client.query<{id: string}>(
    `
      INSERT INTO payout_methods (
        user_id,
        payout_type,
        account_holder_name,
        account_holder_surname,
        currency,
        metadata
      )
      VALUES ($1, 'uruguayan_bank', 'Test', 'Owner', 'UYU', '{}'::jsonb)
      RETURNING id
    `,
    [userId],
  );
  const payoutMethodId = payoutMethodResult.rows[0]!.id;

  return {
    userId,
    producerId,
    ticketWaveId,
    payoutMethodId,
  };
}

async function createListingTicket(
  client: Client,
  input: {
    ticketWaveId: string;
    publisherUserId: string | null;
    publisherEventProducerId: string | null;
    ticketNumber: number;
  },
) {
  const listingResult = await client.query<{id: string}>(
    `
      INSERT INTO listings (ticket_wave_id, publisher_user_id, publisher_event_producer_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [input.ticketWaveId, input.publisherUserId, input.publisherEventProducerId],
  );
  const listingId = listingResult.rows[0]!.id;

  const listingTicketResult = await client.query<{id: string}>(
    `
      INSERT INTO listing_tickets (listing_id, ticket_number, price)
      VALUES ($1, $2, 1500)
      RETURNING id
    `,
    [listingId, input.ticketNumber],
  );

  return {
    listingId,
    listingTicketId: listingTicketResult.rows[0]!.id,
  };
}

async function expectCheckConstraintViolation(
  client: Client,
  queryFn: () => Promise<unknown>,
  constraint: string,
) {
  await client.query('SAVEPOINT owner_invariant_check');
  try {
    await queryFn();
    throw new Error(`Expected check constraint violation for ${constraint}`);
  } catch (error) {
    expect(error).toMatchObject({
      code: '23514',
      constraint,
    });
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT owner_invariant_check');
    await client.query('RELEASE SAVEPOINT owner_invariant_check');
  }
}

describe('Owner invariants integration', () => {
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
    'enforces exactly-one-owner constraints on listings, seller_earnings, and payouts',
    async () => {
      await withRollbackTransaction(connectionString, async client => {
        const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
        const fixture = await createFixture(client, suffix);

        await expect(
          client.query(
            `
              INSERT INTO listings (ticket_wave_id, publisher_user_id, publisher_event_producer_id)
              VALUES ($1, $2, NULL)
            `,
            [fixture.ticketWaveId, fixture.userId],
          ),
        ).resolves.toMatchObject({rowCount: 1});

        await expect(
          client.query(
            `
              INSERT INTO listings (ticket_wave_id, publisher_user_id, publisher_event_producer_id)
              VALUES ($1, NULL, $2)
            `,
            [fixture.ticketWaveId, fixture.producerId],
          ),
        ).resolves.toMatchObject({rowCount: 1});

        await expectCheckConstraintViolation(
          client,
          () =>
            client.query(
            `
              INSERT INTO listings (ticket_wave_id, publisher_user_id, publisher_event_producer_id)
              VALUES ($1, NULL, NULL)
            `,
            [fixture.ticketWaveId],
          ),
          'listings_exactly_one_owner_chk',
        );

        await expectCheckConstraintViolation(
          client,
          () =>
            client.query(
            `
              INSERT INTO listings (ticket_wave_id, publisher_user_id, publisher_event_producer_id)
              VALUES ($1, $2, $3)
            `,
            [fixture.ticketWaveId, fixture.userId, fixture.producerId],
          ),
          'listings_exactly_one_owner_chk',
        );

        const sellerEarningsUserTicket = await createListingTicket(client, {
          ticketWaveId: fixture.ticketWaveId,
          publisherUserId: fixture.userId,
          publisherEventProducerId: null,
          ticketNumber: 1,
        });
        const sellerEarningsProducerTicket = await createListingTicket(client, {
          ticketWaveId: fixture.ticketWaveId,
          publisherUserId: null,
          publisherEventProducerId: fixture.producerId,
          ticketNumber: 2,
        });
        const sellerEarningsNoOwnerTicket = await createListingTicket(client, {
          ticketWaveId: fixture.ticketWaveId,
          publisherUserId: fixture.userId,
          publisherEventProducerId: null,
          ticketNumber: 3,
        });
        const sellerEarningsBothOwnersTicket = await createListingTicket(client, {
          ticketWaveId: fixture.ticketWaveId,
          publisherUserId: fixture.userId,
          publisherEventProducerId: null,
          ticketNumber: 4,
        });

        await expect(
          client.query(
            `
              INSERT INTO seller_earnings (
                listing_ticket_id,
                seller_amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 1000, 'UYU', 'pending', $2, NULL)
            `,
            [sellerEarningsUserTicket.listingTicketId, fixture.userId],
          ),
        ).resolves.toMatchObject({rowCount: 1});

        await expect(
          client.query(
            `
              INSERT INTO seller_earnings (
                listing_ticket_id,
                seller_amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 1000, 'UYU', 'pending', NULL, $2)
            `,
            [sellerEarningsProducerTicket.listingTicketId, fixture.producerId],
          ),
        ).resolves.toMatchObject({rowCount: 1});

        await expectCheckConstraintViolation(
          client,
          () =>
            client.query(
            `
              INSERT INTO seller_earnings (
                listing_ticket_id,
                seller_amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 1000, 'UYU', 'pending', NULL, NULL)
            `,
            [sellerEarningsNoOwnerTicket.listingTicketId],
          ),
          'seller_earnings_exactly_one_owner_chk',
        );

        await expectCheckConstraintViolation(
          client,
          () =>
            client.query(
            `
              INSERT INTO seller_earnings (
                listing_ticket_id,
                seller_amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 1000, 'UYU', 'pending', $2, $3)
            `,
            [
              sellerEarningsBothOwnersTicket.listingTicketId,
              fixture.userId,
              fixture.producerId,
            ],
          ),
          'seller_earnings_exactly_one_owner_chk',
        );

        await expect(
          client.query(
            `
              INSERT INTO payouts (
                payout_method_id,
                payout_provider,
                amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 'manual_bank', 1000, 'UYU', 'pending', $2, NULL)
            `,
            [fixture.payoutMethodId, fixture.userId],
          ),
        ).resolves.toMatchObject({rowCount: 1});

        await expect(
          client.query(
            `
              INSERT INTO payouts (
                payout_method_id,
                payout_provider,
                amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 'manual_bank', 1000, 'UYU', 'pending', NULL, $2)
            `,
            [fixture.payoutMethodId, fixture.producerId],
          ),
        ).resolves.toMatchObject({rowCount: 1});

        await expectCheckConstraintViolation(
          client,
          () =>
            client.query(
            `
              INSERT INTO payouts (
                payout_method_id,
                payout_provider,
                amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 'manual_bank', 1000, 'UYU', 'pending', NULL, NULL)
            `,
            [fixture.payoutMethodId],
          ),
          'payouts_exactly_one_owner_chk',
        );

        await expectCheckConstraintViolation(
          client,
          () =>
            client.query(
            `
              INSERT INTO payouts (
                payout_method_id,
                payout_provider,
                amount,
                currency,
                status,
                seller_user_id,
                seller_event_producer_id
              )
              VALUES ($1, 'manual_bank', 1000, 'UYU', 'pending', $2, $3)
            `,
            [fixture.payoutMethodId, fixture.userId, fixture.producerId],
          ),
          'payouts_exactly_one_owner_chk',
        );
      });
    },
    30000,
  );
});
