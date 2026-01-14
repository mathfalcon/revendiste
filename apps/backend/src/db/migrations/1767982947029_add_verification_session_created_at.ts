import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add column to track when the liveness session was created
  // This allows us to check if the session has expired (5 minute limit)
  // and avoid creating unnecessary new sessions (which cost ~$0.40 each)
  await db.schema
    .alterTable('users')
    .addColumn('verificationSessionCreatedAt', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('verificationSessionCreatedAt')
    .execute();
}
