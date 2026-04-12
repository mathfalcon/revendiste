import type {QrAvailabilityTiming} from '@revendiste/shared';
import {
  ListingTicketsRepository,
  TicketDocumentsRepository,
  OrderTicketReservationsRepository,
  OrdersRepository,
} from '~/repositories';
import {getStorageProvider} from '~/services/storage';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {logger} from '~/utils';
import {TICKET_DOCUMENT_ERROR_MESSAGES} from '~/constants/error-messages';
import {NotificationService} from '~/services/notifications';
import {notifyDocumentUploaded} from '~/services/notifications/helpers';

/**
 * Ticket Document Service
 *
 * Handles ticket document uploads, downloads, and management.
 * Documents are stored using the configured storage provider (local or S3).
 * Supports document versioning and multiple documents per ticket; storage objects are retained for audit (no deletes on replace or soft-delete).
 */
export interface UploadedDocumentData {
  storagePath: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export class TicketDocumentService {
  private storageProvider = getStorageProvider();

  constructor(
    private readonly listingTicketsRepository: ListingTicketsRepository,
    private readonly ticketDocumentsRepository: TicketDocumentsRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly notificationService: NotificationService,
  ) {}

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
      throw new NotFoundError(TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND);
    }

    if (ticket.publisherUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_DOCUMENT_ERROR_MESSAGES.UNAUTHORIZED_UPLOAD,
      );
    }

    // Note: soldAt check removed - sellers can upload documents for unsold tickets
    // when within the QR availability window to prepare for quick sales

    // Validate event hasn't ended
    if (ticket.eventEndDate && new Date(ticket.eventEndDate) < new Date()) {
      throw new ValidationError(TICKET_DOCUMENT_ERROR_MESSAGES.EVENT_ENDED);
    }

    // Validate upload window based on qrAvailabilityTiming
    if (ticket.qrAvailabilityTiming && ticket.eventStartDate) {
      const uploadAvailableAt = this.calculateUploadAvailableAt(
        new Date(ticket.eventStartDate),
        ticket.qrAvailabilityTiming as QrAvailabilityTiming,
      );

      if (new Date() < uploadAvailableAt) {
        throw new ValidationError(
          TICKET_DOCUMENT_ERROR_MESSAGES.UPLOAD_TOO_EARLY(uploadAvailableAt),
        );
      }
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

    const nextVersion = existingDocument ? existingDocument.version + 1 : 1;

    // Upload new document to storage
    // Use 'private/tickets/' prefix for R2 bucket clarity
    // Version in the object key keeps every upload distinct (audit trail — never overwrite)
    const uploadResult = await this.storageProvider.upload(file.buffer, {
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      directory: `private/tickets/${ticket.eventId}`,
      filename: `ticket-${ticketId}-v${nextVersion}`,
    });

    // Create new document record
    // Extract just the filename from the storage path (not the full URL)
    const fileName = uploadResult.path.split('/').pop() || uploadResult.path;

    const documentData = {
      ticketId: ticketId,
      storagePath: uploadResult.path,
      fileName: fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      documentType: 'ticket' as const,
      version: nextVersion,
      status: 'verified' as const,
      uploadedAt: new Date(),
    };

    const newDocument = existingDocument
      ? await this.ticketDocumentsRepository.createReplacingPrimary(
          ticketId,
          documentData,
        )
      : await this.ticketDocumentsRepository.create({
          ...documentData,
          isPrimary: true,
        });

    logger.info('Ticket document uploaded successfully', {
      ticketId,
      documentId: newDocument!.id,
      version: newDocument!.version,
      path: uploadResult.path,
      size: file.sizeBytes,
    });

    // Notify buyers (outside transaction - fire-and-forget)
    // Find all confirmed orders containing this ticket
    const orders =
      await this.orderTicketReservationsRepository.getOrdersByTicketId(
        ticketId,
      );

    // Group by order to avoid duplicate notifications
    const uniqueOrders = Array.from(
      new Map(orders.map(o => [o.orderId, o])).values(),
    );

    // Notify each buyer for their order
    for (const orderInfo of uniqueOrders) {
      // Get full order data with items to count tickets
      const orderWithItems = await this.ordersRepository.getByIdWithItems(
        orderInfo.orderId,
      );

      if (orderWithItems && orderWithItems.event) {
        // Count tickets in this order for the notification
        const ticketCount = orderWithItems.items?.length || 1;

        // Fire-and-forget notification (don't await to avoid blocking)
        notifyDocumentUploaded(this.notificationService, {
          buyerUserId: orderInfo.userId,
          orderId: orderInfo.orderId,
          eventName: orderWithItems.event.name || 'el evento',
          ticketCount,
        }).catch(error => {
          logger.error('Failed to send document uploaded notification', {
            orderId: orderInfo.orderId,
            ticketId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }

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
      throw new NotFoundError(TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND);
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

    // Soft delete the document record (storage objects retained for audit)
    await this.ticketDocumentsRepository.softDelete(
      document.id as unknown as string,
    );

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
    const ticketIds = ticketsWithoutDocs.map(t => t.ticketId);
    return await this.listingTicketsRepository.getUserTicketsRequiringUpload(
      userId,
      ticketIds,
    );
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
      throw new NotFoundError(TICKET_DOCUMENT_ERROR_MESSAGES.TICKET_NOT_FOUND);
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
            url: await this.storageProvider.getUrl(document.storagePath),
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
   * Upload a file buffer to storage only — no DB writes.
   * Use this when you need the storage path before you have a ticketId
   * (e.g. uploading at listing creation time before the DB transaction).
   *
   * The eventId is used for directory organisation on storage.
   */
  async uploadToStorage(
    eventId: string,
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    },
  ): Promise<UploadedDocumentData> {
    this.validateFileType(file.mimeType);

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.sizeBytes > maxSizeBytes) {
      throw new ValidationError(
        TICKET_DOCUMENT_ERROR_MESSAGES.FILE_SIZE_EXCEEDED(
          maxSizeBytes / 1024 / 1024,
        ),
      );
    }

    const uploadResult = await this.storageProvider.upload(file.buffer, {
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      directory: `private/tickets/${eventId}`,
      filename: `ticket-creation-${Date.now()}`,
    });

    const fileName = uploadResult.path.split('/').pop() || uploadResult.path;

    return {
      storagePath: uploadResult.path,
      fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
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
      'image/heic',
      'image/heif',
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

  /**
   * Calculate when upload becomes available based on qrAvailabilityTiming
   */
  private calculateUploadAvailableAt(
    eventStartDate: Date,
    qrAvailabilityTiming: QrAvailabilityTiming,
  ): Date {
    const hoursBeforeEvent = parseInt(
      qrAvailabilityTiming.replace('h', ''),
      10,
    );
    const uploadAvailableAt = new Date(eventStartDate);
    uploadAvailableAt.setHours(uploadAvailableAt.getHours() - hoursBeforeEvent);
    return uploadAvailableAt;
  }
}
