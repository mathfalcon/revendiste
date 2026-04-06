import {type Kysely, type Updateable} from 'kysely';
import type {DB, DocumentTypeEnum, Users} from '@revendiste/shared';
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

  // Upsert user by Clerk ID with core properties from Clerk
  async upsertByClerkId(
    userData: Pick<
      User,
      | 'clerkId'
      | 'email'
      | 'firstName'
      | 'lastName'
      | 'imageUrl'
      | 'lastActiveAt'
      | 'metadata'
    > & {role?: User['role']},
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

  // Update user's phone number and WhatsApp opt-in
  async updatePhoneSettings(
    clerkId: string,
    data: {phoneNumber: string | null; whatsappOptedIn: boolean},
  ) {
    const [user] = await this.db
      .updateTable('users')
      .set({
        phoneNumber: data.phoneNumber,
        whatsappOptedIn: data.whatsappOptedIn,
        updatedAt: new Date(),
      })
      .where('clerkId', '=', clerkId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    return user;
  }

  // Dismiss WhatsApp opt-in prompt
  async dismissWhatsappPrompt(clerkId: string) {
    const [user] = await this.db
      .updateTable('users')
      .set({
        whatsappPromptDismissed: true,
        updatedAt: new Date(),
      })
      .where('clerkId', '=', clerkId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    return user;
  }

  // Update user's image URL
  async updateImageUrl(clerkId: string, imageUrl: string | null) {
    const [user] = await this.db
      .updateTable('users')
      .set({
        imageUrl,
        updatedAt: new Date(),
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

  // Find user by ID
  async getById(id: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return user;
  }

  // Find user by document
  async findByDocument(
    documentType: DocumentTypeEnum,
    documentNumber: string,
    documentCountry?: string,
  ) {
    let query = this.db
      .selectFrom('users')
      .selectAll()
      .where('documentType', '=', documentType)
      .where('documentNumber', '=', documentNumber)
      .where('documentVerified', '=', true)
      .where('deletedAt', 'is', null);

    if (documentCountry) {
      query = query.where('documentCountry', '=', documentCountry);
    }

    return await query.executeTakeFirst();
  }

  // Update user verification data
  async updateVerification(userId: string, data: Updateable<Users>) {
    const now = new Date();

    const [user] = await this.db
      .updateTable('users')
      .set({
        ...data,
        updatedAt: now,
      })
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    return user;
  }

  // Get verifications for admin review with pagination and filtering
  async getVerificationsForAdmin(params: {
    limit: number;
    offset: number;
    status?:
      | 'requires_manual_review'
      | 'pending'
      | 'failed'
      | 'completed'
      | 'rejected';
    sortBy?: 'createdAt' | 'updatedAt' | 'verificationAttempts';
    sortOrder?: 'asc' | 'desc';
  }) {
    let query = this.db
      .selectFrom('users')
      .selectAll()
      .where('deletedAt', 'is', null)
      // Only include users who have started verification (have document info)
      .where('documentType', 'is not', null);

    if (params.status) {
      query = query.where('verificationStatus', '=', params.status);
    }

    const sortColumn = params.sortBy || 'updatedAt';
    const sortOrder = params.sortOrder || 'desc';

    return await query
      .orderBy(sortColumn, sortOrder)
      .limit(params.limit)
      .offset(params.offset)
      .execute();
  }

  // Count verifications for admin review
  async countVerificationsForAdmin(params: {
    status?:
      | 'requires_manual_review'
      | 'pending'
      | 'failed'
      | 'completed'
      | 'rejected';
  }) {
    let query = this.db
      .selectFrom('users')
      .select(eb => eb.fn.countAll<number>().as('count'))
      .where('deletedAt', 'is', null)
      .where('documentType', 'is not', null);

    if (params.status) {
      query = query.where('verificationStatus', '=', params.status);
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count || 0);
  }
}
