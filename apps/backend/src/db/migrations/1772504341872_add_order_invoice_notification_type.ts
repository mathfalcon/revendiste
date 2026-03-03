import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_invoice'`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // PostgreSQL does not support removing values from enums; value will remain but be unused
}
