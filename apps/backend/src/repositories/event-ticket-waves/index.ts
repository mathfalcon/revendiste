import {Kysely} from 'kysely';
import {DB, EventTicketCurrency} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {NotFoundError} from '~/errors';

export class EventTicketWavesRepository extends BaseRepository<EventTicketWavesRepository> {
  withTransaction(trx: Kysely<DB>): EventTicketWavesRepository {
    return new EventTicketWavesRepository(trx);
  }

  async getById(id: string) {
    const result = await this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return result;
  }

  async findByEventId(eventId: string) {
    return this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('eventId', '=', eventId)
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .orderBy('faceValue', 'asc')
      .executeTakeFirst();
  }

  async findAllByEventId(eventId: string) {
    return this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('eventId', '=', eventId)
      .where('deletedAt', 'is', null)
      .orderBy('faceValue', 'asc')
      .execute();
  }

  // ============================================================================
  // Admin CRUD Methods
  // ============================================================================

  /**
   * Create a new ticket wave for an event
   */
  async create(
    eventId: string,
    data: {
      name: string;
      description?: string | null;
      faceValue: number;
      currency: EventTicketCurrency;
      isSoldOut?: boolean;
      isAvailable?: boolean;
      externalId?: string;
    },
  ) {
    const now = new Date();

    const [created] = await this.db
      .insertInto('eventTicketWaves')
      .values({
        eventId,
        name: data.name,
        description: data.description || null,
        faceValue: data.faceValue,
        currency: data.currency,
        isSoldOut: data.isSoldOut ?? false,
        isAvailable: data.isAvailable ?? true,
        externalId: data.externalId || `manual-${Date.now()}`,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastScrapedAt: now,
      })
      .returningAll()
      .execute();

    return created;
  }

  /**
   * Update ticket wave fields
   */
  async update(
    waveId: string,
    data: {
      name?: string;
      description?: string | null;
      faceValue?: number;
      currency?: EventTicketCurrency;
      isSoldOut?: boolean;
      isAvailable?: boolean;
    },
  ) {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    const [updated] = await this.db
      .updateTable('eventTicketWaves')
      .set(updateData)
      .where('id', '=', waveId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    if (!updated) {
      throw new NotFoundError('Tanda de tickets no encontrada');
    }

    return updated;
  }

  /**
   * Soft delete ticket wave
   */
  async softDelete(waveId: string) {
    const now = new Date();

    const [deleted] = await this.db
      .updateTable('eventTicketWaves')
      .set({
        deletedAt: now,
        status: 'inactive',
        updatedAt: now,
      })
      .where('id', '=', waveId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    if (!deleted) {
      throw new NotFoundError('Tanda de tickets no encontrada');
    }

    return deleted;
  }

  /**
   * Clears soft-delete on all waves for an event (admin restore after scraper cleanup)
   */
  async restoreSoftDeletedForEvent(eventId: string) {
    const now = new Date();
    await this.db
      .updateTable('eventTicketWaves')
      .set({
        deletedAt: null,
        status: 'active',
        updatedAt: now,
      })
      .where('eventId', '=', eventId)
      .where('deletedAt', 'is not', null)
      .execute();
  }
}
