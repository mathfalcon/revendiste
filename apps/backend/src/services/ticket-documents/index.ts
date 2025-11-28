import path from 'path';
import type {Kysely} from 'kysely';
import type {DB} from '~/types';
import {
  ListingTicketsRepository,
  TicketDocumentsRepository,
} from '~/repositories';
import {getStorageProvider} from '~/services/storage';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {logger} from '~/utils';
import {TICKET_DOCUMENT_ERROR_MESSAGES} from '~/constants/error-messages';

/**
 * Ticket Document Service
 *
 * Handles ticket document uploads, downloads, and management.
 * Documents are stored using the configured storage provider (local or S3).
 * Supports document versioning and multiple documents per ticket.
 */
export class TicketDocumentService {
  private listingTicketsRepository: ListingTicketsRepository;
  private ticketDocumentsRepository: TicketDocumentsRepository;
  private storageProvider = getStorageProvider();

  constructor(private db: Kysely<DB>) {
    this.listingTicketsRepository = new ListingTicketsRepository(db);
    this.ticketDocumentsRepository = new TicketDocumentsRepository(db);
  }

  /**
   * Upload a ticket document (seller only)
   *
   * Creates a new document version if one already exists.
   * Marks the new document as primary and old ones as replaced.
   *
   * @param ticketId - ID of the ticket to upload document for
   * @param userId - ID of the user uploading (must be the seller)
   * @param file - File buffer and metadata
   */
  async uploadTicketDocument(
    ticketId: string,
    userId: string,
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    },
  ) {
    // Get ticket and verify ownership
    const ticket = await this.listingTicketsRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundError(
        TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    if (ticket.publisherUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_DOCUMENT_ERROR_MESSAGES.UNAUTHORIZED_UPLOAD,
      );
    }

    if (!ticket.soldAt) {
      throw new ValidationError(
        TICKET_DOCUMENT_ERROR_MESSAGES.UNSOLD_TICKET,
      );
    }

    // Validate event hasn't ended
    if (ticket.eventEndDate && new Date(ticket.eventEndDate) < new Date()) {
      throw new ValidationError(
        TICKET_DOCUMENT_ERROR_MESSAGES.EVENT_ENDED,
      );
    }

    // Validate file type
    this.validateFileType(file.mimeType);

    // Validate file size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    const maxSizeMB = maxSizeBytes / 1024 / 1024;
    if (file.sizeBytes > maxSizeBytes) {
      throw new ValidationError(
        TICKET_DOCUMENT_ERROR_MESSAGES.FILE_SIZE_EXCEEDED(maxSizeMB),
      );
    }

    // Get existing primary document (if any)
    const existingDocument =
      await this.ticketDocumentsRepository.getPrimaryDocument(ticketId);

    // Upload new document to storage
    const uploadResult = await this.storageProvider.upload(file.buffer, {
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      directory: `tickets/${ticket.eventId}`,
      filename: `ticket-${ticketId}`,
    });

    // Create new document record
    const newDocument = await this.ticketDocumentsRepository.create({
      ticketId: ticketId,
      storagePath: uploadResult.path,
      fileName: path.basename(uploadResult.path),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      documentType: 'ticket',
      version: existingDocument ? (existingDocument.version as unknown as number) + 1 : 1,
      isPrimary: true,
      status: 'verified',
      uploadedAt: new Date(),
    });

    // If there was an existing document, replace it
    if (existingDocument) {
      await this.ticketDocumentsRepository.replacePrimaryDocument(
        ticketId,
        newDocument!.id as unknown as string,
      );

      // Optionally delete old file from storage
      try {
        await this.storageProvider.delete(existingDocument.storagePath);
        logger.info('Deleted old ticket document from storage', {
          ticketId,
          oldPath: existingDocument.storagePath,
          oldVersion: existingDocument.version,
        });
      } catch (error) {
        logger.warn('Failed to delete old ticket document', {
          ticketId,
          error,
        });
      }
    }

    logger.info('Ticket document uploaded successfully', {
      ticketId,
      documentId: newDocument!.id,
      version: newDocument!.version,
      path: uploadResult.path,
      size: file.sizeBytes,
    });

    return {
      document: newDocument,
      documentUrl: uploadResult.url,
    };
  }

  /**
   * Get ticket document (seller or buyer)
   *
   * Sellers can access their own tickets.
   * Buyers can access tickets from their confirmed orders.
   *
   * @param ticketId - ID of the ticket
   * @param userId - ID of the user requesting access
   * @param orderId - Optional order ID (for buyer access)
   */
  async getTicketDocument(
    ticketId: string,
    userId: string,
    orderId?: string,
  ): Promise<{buffer: Buffer; mimeType: string; filename: string}> {
    let ticket;

    // If orderId is provided, verify buyer access
    if (orderId) {
      ticket = await this.listingTicketsRepository.getTicketByOrderId(
        orderId,
        ticketId,
      );

      if (!ticket) {
        throw new NotFoundError(
          TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND_FOR_ORDER,
        );
      }

      if (ticket.buyerUserId !== userId) {
        throw new UnauthorizedError(
          TICKET_DOCUMENT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        );
      }
    } else {
      // Otherwise, verify seller access
      ticket = await this.listingTicketsRepository.getTicketById(ticketId);

      if (!ticket) {
        throw new NotFoundError(
          TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND,
        );
      }

      if (ticket.publisherUserId !== userId) {
        throw new UnauthorizedError(
          TICKET_DOCUMENT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        );
      }
    }

    // Get the primary document for this ticket
    const document =
      await this.ticketDocumentsRepository.getPrimaryDocument(ticketId);

    if (!document) {
      throw new NotFoundError(
        TICKET_DOCUMENT_ERROR_MESSAGES.DOCUMENT_NOT_FOUND,
      );
    }

    // Get document from storage
    const buffer = await this.storageProvider.getBuffer(document.storagePath);

    return {
      buffer,
      mimeType: document.mimeType,
      filename: document.originalName,
    };
  }

  /**
   * Delete ticket document (seller only)
   *
   * Soft deletes the primary document for the ticket.
   *
   * @param ticketId - ID of the ticket
   * @param userId - ID of the user (must be the seller)
   */
  async deleteTicketDocument(ticketId: string, userId: string) {
    const ticket = await this.listingTicketsRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundError(
        TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    if (ticket.publisherUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_DOCUMENT_ERROR_MESSAGES.UNAUTHORIZED_DELETE,
      );
    }

    // Get the primary document
    const document =
      await this.ticketDocumentsRepository.getPrimaryDocument(ticketId);

    if (!document) {
      throw new NotFoundError(
        TICKET_DOCUMENT_ERROR_MESSAGES.DOCUMENT_NOT_FOUND_FOR_DELETE,
      );
    }

    // Delete from storage
    await this.storageProvider.delete(document.storagePath);

    // Soft delete the document record
    await this.ticketDocumentsRepository.softDelete(document.id as unknown as string);

    logger.info('Ticket document deleted successfully', {
      ticketId,
      documentId: document.id,
    });

    return {success: true};
  }

  /**
   * Get list of sold tickets without documents (for sellers)
   *
   * @param userId - ID of the seller
   */
  async getTicketsRequiringUpload(userId: string) {
    // Get all tickets without documents
    const ticketsWithoutDocs =
      await this.ticketDocumentsRepository.getTicketsWithoutDocuments();

    // Filter by user and return only their tickets
    const userTickets = await this.db
      .selectFrom('listingTickets as lt')
      .leftJoin('listings as tl', 'tl.id', 'lt.listingId')
      .leftJoin('eventTicketWaves as etw', 'etw.id', 'tl.ticketWaveId')
      .leftJoin('events as e', 'e.id', 'etw.eventId')
      .select([
        'lt.id',
        'lt.listingId',
        'lt.ticketNumber',
        'lt.soldAt',
        'e.name as eventName',
        'e.eventStartDate',
        'etw.name as ticketWaveName',
      ])
      .where(
        'lt.id',
        'in',
        ticketsWithoutDocs.map(t => t.ticketId),
      )
      .where('tl.publisherUserId', '=', userId)
      .where('lt.deletedAt', 'is', null)
      .where('lt.cancelledAt', 'is', null)
      .where('tl.deletedAt', 'is', null)
      .execute();

    return userTickets;
  }

  /**
   * Get ticket information with document status (for sellers)
   *
   * @param ticketId - ID of the ticket
   * @param userId - ID of the user (must be the seller)
   */
  async getTicketInfo(ticketId: string, userId: string) {
    const ticket = await this.listingTicketsRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundError(
        TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND,
      );
    }

    if (ticket.publisherUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_DOCUMENT_ERROR_MESSAGES.UNAUTHORIZED_VIEW,
      );
    }

    // Get primary document (if any)
    const document =
      await this.ticketDocumentsRepository.getPrimaryDocument(ticketId);

    // Get all documents for version history
    const allDocuments =
      await this.ticketDocumentsRepository.getAllDocuments(ticketId);

    return {
      id: ticket.id,
      listingId: ticket.listingId,
      ticketNumber: ticket.ticketNumber,
      price: ticket.price,
      soldAt: ticket.soldAt,
      hasDocument: !!document,
      document: document
        ? {
            id: document.id,
            uploadedAt: document.uploadedAt,
            mimeType: document.mimeType,
            originalName: document.originalName,
            sizeBytes: document.sizeBytes,
            version: document.version,
            status: document.status,
            url: this.storageProvider.getUrl(document.storagePath),
          }
        : null,
      documentHistory: allDocuments.map(doc => ({
        id: doc.id,
        version: doc.version,
        uploadedAt: doc.uploadedAt,
        isPrimary: doc.isPrimary,
        status: doc.status,
      })),
      event: {
        id: ticket.eventId,
        name: ticket.eventName,
        startDate: ticket.eventStartDate,
      },
      ticketWave: {
        name: ticket.ticketWaveName,
      },
    };
  }

  /**
   * Validate file type for ticket documents
   */
  private validateFileType(mimeType: string): void {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new ValidationError(
        TICKET_DOCUMENT_ERROR_MESSAGES.INVALID_FILE_TYPE(
          mimeType,
          allowedTypes,
        ),
      );
    }
  }
}

