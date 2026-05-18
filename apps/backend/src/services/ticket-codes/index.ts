import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {TICKET_CODE_ERROR_MESSAGES} from '~/constants/error-messages';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {ListingTicketsRepository, TicketCodesRepository} from '~/repositories';
import {isUniqueViolation} from '~/utils/db-errors';

const DEFAULT_WINDOW_SECONDS = 300;

function signPayload(
  secret: Buffer,
  listingTicketId: string,
  generation: number,
  windowStart: number,
) {
  return createHmac('sha256', secret)
    .update(`${listingTicketId}|${generation}|${windowStart}`)
    .digest('base64url');
}

export class TicketCodesService {
  constructor(
    private readonly ticketCodesRepository: TicketCodesRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
  ) {}

  withTransaction(trx: Kysely<DB>) {
    return new TicketCodesService(
      this.ticketCodesRepository.withTransaction(trx),
      this.listingTicketsRepository.withTransaction(trx),
    );
  }

  async getOrCreate(listingTicketId: string) {
    const existing =
      await this.ticketCodesRepository.getByListingTicketId(listingTicketId);
    if (existing) {
      return existing;
    }

    try {
      return await this.ticketCodesRepository.create({
        listingTicketId,
        secret: randomBytes(32),
        generation: 0,
        windowSeconds: DEFAULT_WINDOW_SECONDS,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const raceSafeRecord =
          await this.ticketCodesRepository.getByListingTicketId(listingTicketId);
        if (raceSafeRecord) {
          return raceSafeRecord;
        }
      }
      throw error;
    }
  }

  async bumpGeneration(listingTicketIds: string[]) {
    if (listingTicketIds.length === 0) {
      return [];
    }

    const existingCodes =
      await this.ticketCodesRepository.getByListingTicketIds(listingTicketIds);
    const existingIds = new Set(existingCodes.map(code => code.listingTicketId));
    const missingCodes = listingTicketIds
      .filter(ticketId => !existingIds.has(ticketId))
      .map(ticketId => ({
        listingTicketId: ticketId,
        secret: randomBytes(32),
        generation: 0,
        windowSeconds: DEFAULT_WINDOW_SECONDS,
      }));

    await this.ticketCodesRepository.createManyIfMissing(missingCodes);

    return await this.ticketCodesRepository.bumpGenerationByTicketIds(
      listingTicketIds,
    );
  }

  async issueDisplayToken(listingTicketId: string, requestingUserId: string) {
    const ticket =
      await this.listingTicketsRepository.getTicketForCodeIssue(listingTicketId);

    if (!ticket) {
      throw new NotFoundError(TICKET_CODE_ERROR_MESSAGES.TICKET_NOT_FOUND);
    }

    if (!ticket.isOfficial) {
      throw new ValidationError(TICKET_CODE_ERROR_MESSAGES.ROTATION_NOT_AVAILABLE);
    }

    if (!ticket.currentOwnerUserId || ticket.currentOwnerUserId !== requestingUserId) {
      throw new UnauthorizedError(TICKET_CODE_ERROR_MESSAGES.NOT_TICKET_OWNER);
    }

    const codeRecord = await this.getOrCreate(listingTicketId);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const windowStart =
      Math.floor(nowSeconds / codeRecord.windowSeconds) * codeRecord.windowSeconds;
    const signature = signPayload(
      codeRecord.secret as Buffer,
      listingTicketId,
      codeRecord.generation,
      windowStart,
    );

    return {
      listingTicketId,
      qrPayload: `${listingTicketId}.${codeRecord.generation}.${windowStart}.${signature}`,
      expiresAt: new Date((windowStart + codeRecord.windowSeconds) * 1000),
      windowSeconds: codeRecord.windowSeconds,
      supportsNfc: false,
    };
  }

  async verify(qrPayload: string) {
    const [listingTicketId, generationPart, windowStartPart, signature] =
      qrPayload.split('.');
    if (!listingTicketId || !generationPart || !windowStartPart || !signature) {
      return {
        isValid: false,
        reason: TICKET_CODE_ERROR_MESSAGES.INVALID_QR_PAYLOAD,
      };
    }

    const generation = Number(generationPart);
    const tokenWindowStart = Number(windowStartPart);

    if (!Number.isInteger(generation) || !Number.isInteger(tokenWindowStart)) {
      return {
        isValid: false,
        reason: TICKET_CODE_ERROR_MESSAGES.INVALID_QR_PAYLOAD,
      };
    }

    const codeRecord =
      await this.ticketCodesRepository.getByListingTicketId(listingTicketId);
    if (!codeRecord) {
      return {
        isValid: false,
        reason: TICKET_CODE_ERROR_MESSAGES.INVALID_QR_SIGNATURE,
      };
    }

    if (generation !== codeRecord.generation) {
      return {
        isValid: false,
        reason: TICKET_CODE_ERROR_MESSAGES.GENERATION_MISMATCH,
      };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const currentWindowStart =
      Math.floor(nowSeconds / codeRecord.windowSeconds) * codeRecord.windowSeconds;
    const previousWindowStart = currentWindowStart - codeRecord.windowSeconds;
    if (
      tokenWindowStart !== currentWindowStart &&
      tokenWindowStart !== previousWindowStart
    ) {
      return {
        isValid: false,
        reason: TICKET_CODE_ERROR_MESSAGES.EXPIRED_QR_TOKEN,
      };
    }

    const expectedSignature = signPayload(
      codeRecord.secret as Buffer,
      listingTicketId,
      generation,
      tokenWindowStart,
    );

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signature);
    const signaturesMatch =
      expectedBuffer.length === providedBuffer.length &&
      timingSafeEqual(expectedBuffer, providedBuffer);

    if (!signaturesMatch) {
      return {
        isValid: false,
        reason: TICKET_CODE_ERROR_MESSAGES.INVALID_QR_SIGNATURE,
      };
    }

    return {
      isValid: true,
      listingTicketId,
      generation,
      tokenWindowStart,
    };
  }
}
