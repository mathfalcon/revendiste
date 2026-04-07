import {sql, type Kysely} from 'kysely';

/**
 * Provider-agnostic settlement batches and line items (dLocal, Stripe, etc.).
 * Uniqueness of external settlement id is per processor: (payment_provider, settlement_id).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('processor_settlements')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('settlement_id', 'text', col => col.notNull())
    .addColumn(
      'payment_provider',
      sql`payment_provider`,
      col => col.notNull().defaultTo(sql`'dlocal'::payment_provider`),
    )
    .addColumn('settlement_date', 'date', col => col.notNull())
    .addColumn('total_amount', 'decimal(18, 2)', col => col.notNull())
    .addColumn('currency', 'text', col => col.notNull())
    .addColumn('status', 'text', col => col.notNull())
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamp', col =>
      col.defaultTo(db.fn('now')).notNull(),
    )
    .addColumn('updated_at', 'timestamp', col =>
      col.defaultTo(db.fn('now')).notNull(),
    )
    .addUniqueConstraint('processor_settlements_provider_external_uidx', [
      'payment_provider',
      'settlement_id',
    ])
    .execute();

  await db.schema
    .createTable('processor_settlement_items')
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('settlement_id', 'text', col =>
      col.notNull().references('processor_settlements.id').onDelete('cascade'),
    )
    .addColumn('operation_id', 'text', col => col.notNull())
    .addColumn('payout_id', 'text')
    .addColumn('amount', 'decimal(18, 2)', col => col.notNull())
    .addColumn('exchange_rate', 'decimal(10, 6)')
    .addColumn('fees', 'decimal(18, 2)')
    .addColumn('net_amount', 'decimal(18, 2)', col => col.notNull())
    .addColumn('currency', 'text', col => col.notNull())
    .addColumn('description', 'text')
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamp', col =>
      col.defaultTo(db.fn('now')).notNull(),
    )
    .addColumn('updated_at', 'timestamp', col =>
      col.defaultTo(db.fn('now')).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_processor_settlements_status')
    .on('processor_settlements')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_processor_settlements_settlement_date')
    .on('processor_settlements')
    .column('settlement_date')
    .execute();

  await db.schema
    .createIndex('idx_processor_settlements_payment_provider')
    .on('processor_settlements')
    .column('payment_provider')
    .execute();

  await db.schema
    .createIndex('idx_processor_settlement_items_settlement_id')
    .on('processor_settlement_items')
    .column('settlement_id')
    .execute();

  await db.schema
    .createIndex('idx_processor_settlement_items_payout_id')
    .on('processor_settlement_items')
    .column('payout_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_processor_settlement_items_payout_id')
    .execute();
  await db.schema
    .dropIndex('idx_processor_settlement_items_settlement_id')
    .execute();
  await db.schema
    .dropIndex('idx_processor_settlements_payment_provider')
    .execute();
  await db.schema
    .dropIndex('idx_processor_settlements_settlement_date')
    .execute();
  await db.schema.dropIndex('idx_processor_settlements_status').execute();

  await db.schema.dropTable('processor_settlement_items').execute();
  await db.schema.dropTable('processor_settlements').execute();
}
