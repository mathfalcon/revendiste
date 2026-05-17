import type {EventProducerMemberRole, EventTicketCurrency} from '@revendiste/shared';
import {
  EventProducerMembersRepository,
  EventProducersRepository,
  UsersRepository,
} from '~/repositories';
import {generateUniqueSlug} from '~/utils';
import {NotFoundError, ValidationError} from '~/errors';
import {EVENT_PRODUCER_ERROR_MESSAGES} from '~/constants/error-messages';

type CreateEventProducerInput = {
  name: string;
  slug?: string;
  legalName?: string | null;
  taxId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  defaultBuyerCommissionRate?: number | null;
  defaultProducerFeeAmount?: number | null;
  defaultProducerFeeCurrency?: EventTicketCurrency | null;
  ownerUserId?: string;
};

type UpdateEventProducerInput = {
  name?: string;
  slug?: string;
  legalName?: string | null;
  taxId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  defaultBuyerCommissionRate?: number | null;
  defaultProducerFeeAmount?: number | null;
  defaultProducerFeeCurrency?: EventTicketCurrency | null;
};

type AddEventProducerMemberInput = {
  userId: string;
  role: EventProducerMemberRole;
  accepted?: boolean;
};

export class EventProducersService {
  constructor(
    private readonly eventProducersRepository: EventProducersRepository,
    private readonly eventProducerMembersRepository: EventProducerMembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async listEventProducers(search?: string) {
    return await this.eventProducersRepository.list(search);
  }

  async getEventProducer(eventProducerId: string) {
    const producer = await this.getRequiredEventProducer(eventProducerId);
    const members =
      await this.eventProducerMembersRepository.listByEventProducerId(
        eventProducerId,
      );

    return {
      ...producer,
      members,
    };
  }

  async createEventProducer(data: CreateEventProducerInput) {
    this.validateFeePair(
      data.defaultProducerFeeAmount ?? null,
      data.defaultProducerFeeCurrency ?? null,
    );

    if (data.ownerUserId) {
      const owner = await this.usersRepository.getById(data.ownerUserId);
      if (!owner) {
        throw new NotFoundError(EVENT_PRODUCER_ERROR_MESSAGES.USER_NOT_FOUND);
      }
    }

    const slug = await this.resolveUniqueSlug(data.name, data.slug);
    const now = new Date();

    return await this.eventProducersRepository.executeTransaction(async trx => {
      const producersRepo = this.eventProducersRepository.withTransaction(trx);
      const membersRepo = this.eventProducerMembersRepository.withTransaction(trx);

      const producer = await producersRepo.create({
        name: data.name,
        slug,
        legalName: data.legalName ?? null,
        taxId: data.taxId ?? null,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        country: data.country ?? null,
        defaultBuyerCommissionRate: data.defaultBuyerCommissionRate ?? null,
        defaultProducerFeeAmount: data.defaultProducerFeeAmount ?? null,
        defaultProducerFeeCurrency: data.defaultProducerFeeCurrency ?? null,
        createdAt: now,
        updatedAt: now,
      });

      if (data.ownerUserId) {
        await membersRepo.create({
          eventProducerId: producer.id,
          userId: data.ownerUserId,
          role: 'owner',
          invitedAt: now,
          acceptedAt: now,
          createdAt: now,
        });
      }

      const members = await membersRepo.listByEventProducerId(producer.id);
      return {
        ...producer,
        members,
      };
    });
  }

  async updateEventProducer(
    eventProducerId: string,
    data: UpdateEventProducerInput,
  ) {
    const existing = await this.getRequiredEventProducer(eventProducerId);

    const nextFeeAmount =
      data.defaultProducerFeeAmount !== undefined
        ? data.defaultProducerFeeAmount
        : existing.defaultProducerFeeAmount;
    const nextFeeCurrency =
      data.defaultProducerFeeCurrency !== undefined
        ? data.defaultProducerFeeCurrency
        : existing.defaultProducerFeeCurrency;
    this.validateFeePair(nextFeeAmount, nextFeeCurrency);

    const updatePayload = {...data};
    if (data.slug !== undefined) {
      const normalizedSlug = data.slug.trim();
      if (normalizedSlug.length === 0) {
        throw new ValidationError(
          EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_SLUG_ALREADY_EXISTS,
        );
      }
      const slugExists = await this.eventProducersRepository.slugExists(
        normalizedSlug,
        existing.id,
      );
      if (slugExists) {
        throw new ValidationError(
          EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_SLUG_ALREADY_EXISTS,
        );
      }
      updatePayload.slug = normalizedSlug;
    }

    const updated = await this.eventProducersRepository.update(
      eventProducerId,
      updatePayload,
    );

    if (!updated) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_NOT_FOUND,
      );
    }

    const members =
      await this.eventProducerMembersRepository.listByEventProducerId(
        eventProducerId,
      );

    return {
      ...updated,
      members,
    };
  }

  async deleteEventProducer(eventProducerId: string) {
    const producer = await this.getRequiredEventProducer(eventProducerId);
    const deleted = await this.eventProducersRepository.softDelete(eventProducerId);
    if (!deleted) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_NOT_FOUND,
      );
    }

    return {
      id: producer.id,
      deletedAt: deleted.deletedAt,
    };
  }

  async listMembers(eventProducerId: string) {
    await this.getRequiredEventProducer(eventProducerId);
    return await this.eventProducerMembersRepository.listByEventProducerId(
      eventProducerId,
    );
  }

  async addMember(
    eventProducerId: string,
    data: AddEventProducerMemberInput,
  ) {
    await this.getRequiredEventProducer(eventProducerId);

    const user = await this.usersRepository.getById(data.userId);
    if (!user) {
      throw new NotFoundError(EVENT_PRODUCER_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const existingActive =
      await this.eventProducerMembersRepository.getActiveByEventProducerAndUser(
        eventProducerId,
        data.userId,
      );
    if (existingActive) {
      throw new ValidationError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBER_ALREADY_EXISTS,
      );
    }

    const now = new Date();
    return await this.eventProducerMembersRepository.create({
      eventProducerId,
      userId: data.userId,
      role: data.role,
      invitedAt: now,
      acceptedAt: data.accepted ? now : null,
      createdAt: now,
    });
  }

  async updateMemberRole(
    eventProducerId: string,
    userId: string,
    role: EventProducerMemberRole,
  ) {
    await this.getRequiredEventProducer(eventProducerId);
    const member =
      await this.eventProducerMembersRepository.getActiveByEventProducerAndUser(
        eventProducerId,
        userId,
      );
    if (!member) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBER_NOT_FOUND,
      );
    }

    const updated = await this.eventProducerMembersRepository.updateRole(
      eventProducerId,
      userId,
      role,
    );

    if (!updated) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBER_NOT_FOUND,
      );
    }

    return updated;
  }

  async removeMember(eventProducerId: string, userId: string) {
    await this.getRequiredEventProducer(eventProducerId);
    const deleted =
      await this.eventProducerMembersRepository.softDeleteByEventProducerAndUser(
        eventProducerId,
        userId,
      );

    if (!deleted) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_MEMBER_NOT_FOUND,
      );
    }

    return deleted;
  }

  private async getRequiredEventProducer(eventProducerId: string) {
    const producer = await this.eventProducersRepository.getById(eventProducerId);
    if (!producer) {
      throw new NotFoundError(
        EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_NOT_FOUND,
      );
    }
    return producer;
  }

  private validateFeePair(
    amount: number | string | null | undefined,
    currency: EventTicketCurrency | null | undefined,
  ) {
    const hasAmount = amount !== null && amount !== undefined;
    const hasCurrency = currency !== null && currency !== undefined;
    if (hasAmount !== hasCurrency) {
      throw new ValidationError(
        EVENT_PRODUCER_ERROR_MESSAGES.DEFAULT_FEE_PAIR_REQUIRED,
      );
    }
  }

  private async resolveUniqueSlug(name: string, requestedSlug?: string) {
    if (requestedSlug && requestedSlug.trim().length > 0) {
      const normalized = requestedSlug.trim();
      const exists = await this.eventProducersRepository.slugExists(normalized);
      if (exists) {
        throw new ValidationError(
          EVENT_PRODUCER_ERROR_MESSAGES.EVENT_PRODUCER_SLUG_ALREADY_EXISTS,
        );
      }
      return normalized;
    }

    return await generateUniqueSlug(name, slug =>
      this.eventProducersRepository.slugExists(slug),
    );
  }
}
