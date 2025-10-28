import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create order status enum
  await sql`CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled', 'expired')`.execute(
    db,
  );

  // Create ORDERS table - tracks ticket reservations/purchases
  await db.schema
    .createTable('orders')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', col => col.notNull().references('users.id'))
    .addColumn('event_id', 'uuid', col => col.notNull().references('events.id'))
    .addColumn('status', sql`order_status`, col =>
      col.defaultTo('pending').notNull(),
    )
    .addColumn('total_amount', 'numeric', col => col.notNull()) // total amount including fees
    .addColumn('subtotal_amount', 'numeric', col => col.notNull()) // ticket prices only
    .addColumn('platform_commission', 'numeric', col => col.notNull()) // 6% commission
    .addColumn('vat_on_commission', 'numeric', col => col.notNull()) // 22% VAT on commission
    .addColumn('currency', 'varchar(3)', col => col.notNull())
    .addColumn('reservation_expires_at', 'timestamptz', col => col.notNull()) // 10 minutes from creation
    .addColumn('confirmed_at', 'timestamptz') // when order was confirmed/purchased
    .addColumn('cancelled_at', 'timestamptz') // when order was cancelled
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create ORDER_ITEMS table - individual ticket selections within an order
  await db.schema
    .createTable('order_items')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', col =>
      col.notNull().references('orders.id').onDelete('cascade'),
    )
    .addColumn('ticket_wave_id', 'uuid', col =>
      col.notNull().references('event_ticket_waves.id'),
    )
    .addColumn('price_per_ticket', 'numeric', col => col.notNull())
    .addColumn('quantity', 'integer', col => col.notNull())
    .addColumn('subtotal', 'numeric', col => col.notNull()) // price_per_ticket * quantity
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create ORDER_TICKET_RESERVATIONS join table - links orders to specific tickets
  await db.schema
    .createTable('order_ticket_reservations')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', col =>
      col.notNull().references('orders.id').onDelete('cascade'),
    )
    .addColumn('listing_ticket_id', 'uuid', col =>
      col.notNull().references('listing_tickets.id').onDelete('cascade'),
    )
    .addColumn('reserved_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('reserved_until', 'timestamptz', col => col.notNull())
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create indexes for better performance
  await db.schema
    .createIndex('orders_user_id_idx')
    .on('orders')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('orders_event_id_idx')
    .on('orders')
    .column('event_id')
    .execute();

  await db.schema
    .createIndex('orders_status_idx')
    .on('orders')
    .column('status')
    .execute();

  await db.schema
    .createIndex('orders_reservation_expires_at_idx')
    .on('orders')
    .column('reservation_expires_at')
    .execute();

  await db.schema
    .createIndex('order_items_order_id_idx')
    .on('order_items')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('order_items_ticket_wave_id_idx')
    .on('order_items')
    .column('ticket_wave_id')
    .execute();

  await db.schema
    .createIndex('order_ticket_reservations_order_id_idx')
    .on('order_ticket_reservations')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('order_ticket_reservations_listing_ticket_id_idx')
    .on('order_ticket_reservations')
    .column('listing_ticket_id')
    .execute();

  await db.schema
    .createIndex('order_ticket_reservations_reserved_until_idx')
    .on('order_ticket_reservations')
    .column('reserved_until')
    .execute();

  await db.schema
    .createIndex('order_ticket_reservations_deleted_at_idx')
    .on('order_ticket_reservations')
    .column('deleted_at')
    .execute();

  // Note: We'll handle uniqueness in application logic since PostgreSQL
  // requires immutable functions in index predicates
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes first
  await db.schema
    .dropIndex('order_ticket_reservations_deleted_at_idx')
    .execute();
  await db.schema
    .dropIndex('order_ticket_reservations_reserved_until_idx')
    .execute();
  await db.schema
    .dropIndex('order_ticket_reservations_listing_ticket_id_idx')
    .execute();
  await db.schema.dropIndex('order_ticket_reservations_order_id_idx').execute();
  await db.schema.dropIndex('order_items_ticket_wave_id_idx').execute();
  await db.schema.dropIndex('order_items_order_id_idx').execute();
  await db.schema.dropIndex('orders_reservation_expires_at_idx').execute();
  await db.schema.dropIndex('orders_status_idx').execute();
  await db.schema.dropIndex('orders_event_id_idx').execute();
  await db.schema.dropIndex('orders_user_id_idx').execute();

  // Drop tables (order matters due to foreign key constraints)
  await db.schema.dropTable('order_ticket_reservations').execute();
  await db.schema.dropTable('order_items').execute();
  await db.schema.dropTable('orders').execute();

  // Drop enums
  await sql`DROP TYPE IF EXISTS order_status`.execute(db);
}
