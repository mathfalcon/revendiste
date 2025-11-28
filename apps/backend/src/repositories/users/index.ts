import {type Kysely} from 'kysely';
import type {DB} from '../../types/db';
import {logger} from '~/utils';
import {User} from '~/types';
import {BaseRepository} from '../base';

export class UsersRepository extends BaseRepository<UsersRepository> {
  withTransaction(trx: Kysely<DB>): UsersRepository {
    return new UsersRepository(trx);
  }

  // Find user by Clerk ID
  async findByClerkId(clerkId: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('clerkId', '=', clerkId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return user;
  }

  // Upsert user by Clerk ID with all properties
  async upsertByClerkId(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ) {
    const now = new Date();

    try {
      const [user] = await this.db
        .insertInto('users')
        .values({
          clerkId: userData.clerkId,
          email: userData.email,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          imageUrl: userData.imageUrl || null,
          lastActiveAt: userData.lastActiveAt || now,
          metadata: userData.metadata || null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflict(oc =>
          oc.column('clerkId').doUpdateSet({
            email: userData.email,
            firstName: userData.firstName || null,
            lastName: userData.lastName || null,
            imageUrl: userData.imageUrl || null,
            lastActiveAt: userData.lastActiveAt || now,
            metadata: userData.metadata || null,
            updatedAt: now,
          }),
        )
        .returningAll()
        .execute();

      return user;
    } catch (error) {
      logger.error(
        `Failed to upsert user with clerk ID ${userData.clerkId}:`,
        error,
      );
      throw error;
    }
  }

  // Update user's last active timestamp
  async updateLastActive(clerkId: string, lastActiveAt: Date) {
    const [user] = await this.db
      .updateTable('users')
      .set({
        lastActiveAt: lastActiveAt,
        updatedAt: lastActiveAt,
      })
      .where('clerkId', '=', clerkId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    return user;
  }

  // Soft delete user
  async softDelete(clerkId: string) {
    const now = new Date();

    const [user] = await this.db
      .updateTable('users')
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where('clerkId', '=', clerkId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    return user;
  }

  // Find user by email
  async findByEmail(email: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return user;
  }
}
