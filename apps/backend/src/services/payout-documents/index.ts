import path from 'path';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {PayoutsRepository, PayoutDocumentsRepository} from '~/repositories';
import {getStorageProvider} from '~/services/storage';
import {NotFoundError, ValidationError, UnauthorizedError} from '~/errors';
import {logger} from '~/utils';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';

/**
 * Payout Document Service
 *
 * Handles payout document uploads (vouchers, receipts, etc.).
 * Documents are stored using the configured storage provider (local or S3).
 * Supports multiple documents per payout.
 */
export class PayoutDocumentsService {
  private payoutsRepository: PayoutsRepository;
  private payoutDocumentsRepository: PayoutDocumentsRepository;
  private storageProvider = getStorageProvider();

  constructor(private db: Kysely<DB>) {
    this.payoutsRepository = new PayoutsRepository(db);
    this.payoutDocumentsRepository = new PayoutDocumentsRepository(db);
  }

  /**
   * Upload a payout document (admin only)
   *
   * @param payoutId - ID of the payout to upload document for
   * @param adminUserId - ID of the admin user uploading
   * @param file - File buffer and metadata
   */
  async uploadPayoutDocument(
    payoutId: string,
    adminUserId: string,
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    },
  ) {
    // Verify payout exists
    const payout = await this.payoutsRepository.getById(payoutId);

    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Validate file type
    this.validateFileType(file.mimeType);

    // Validate file size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    const maxSizeMB = maxSizeBytes / 1024 / 1024;
    if (file.sizeBytes > maxSizeBytes) {
      throw new ValidationError(
        `El archivo excede el tamaño máximo de ${maxSizeMB}MB`,
      );
    }

    // Upload new document to storage
    // Use 'private/payouts/' prefix for R2 bucket clarity
    const uploadResult = await this.storageProvider.upload(file.buffer, {
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      directory: `private/payouts/${payoutId}`,
      filename: `voucher-${Date.now()}`,
    });

    // Create new document record
    const newDocument = await this.payoutDocumentsRepository.create({
      payoutId: payoutId,
      storagePath: uploadResult.path,
      fileName: path.basename(uploadResult.path),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      documentType: 'voucher',
      uploadedBy: adminUserId,
    });

    if (!newDocument) {
      throw new ValidationError('Error al crear el registro del documento');
    }

    logger.info('Payout document uploaded', {
      payoutId,
      documentId: newDocument.id,
      adminUserId,
      fileName: file.originalName,
    });

    return {
      document: newDocument,
      documentUrl: uploadResult.url,
    };
  }

  /**
   * Get all documents for a payout
   * Only accessible by the payout requester (seller) or admin users
   *
   * @param payoutId - ID of the payout
   * @param userId - ID of the user requesting access
   * @param isAdmin - Whether the user is an admin
   */
  async getPayoutDocuments(payoutId: string, userId: string, isAdmin: boolean) {
    // Verify payout exists
    const payout = await this.payoutsRepository.getById(payoutId);

    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Check authorization: user must be admin OR the seller who requested the payout
    if (!isAdmin && payout.sellerUserId !== userId) {
      throw new UnauthorizedError(PAYOUT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    const documents = await this.payoutDocumentsRepository.getByPayoutId(
      payoutId,
    );

    // Get URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async doc => {
        // Get URL from storage provider
        const url = await this.storageProvider.getUrl(doc.storagePath);

        return {
          ...doc,
          url,
        };
      }),
    );

    return documentsWithUrls;
  }

  /**
   * Delete a payout document (admin only)
   *
   * @param documentId - ID of the document to delete
   * @param adminUserId - ID of the admin user deleting
   */
  async deletePayoutDocument(documentId: string, adminUserId: string) {
    // Get document
    const document = await this.payoutDocumentsRepository.getById(documentId);

    if (!document) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Verify payout exists
    const payout = await this.payoutsRepository.getById(document.payoutId);

    if (!payout) {
      throw new NotFoundError(PAYOUT_ERROR_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // Soft delete the document
    const deleted = await this.payoutDocumentsRepository.softDelete(documentId);

    if (!deleted) {
      throw new ValidationError('Error al eliminar el documento');
    }

    logger.info('Payout document deleted', {
      documentId,
      payoutId: document.payoutId,
      adminUserId,
      fileName: document.originalName,
    });

    return {success: true};
  }

  /**
   * Validate file type
   */
  private validateFileType(mimeType: string): void {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new ValidationError(
        `Tipo de archivo no permitido: ${mimeType}. Tipos permitidos: ${allowedTypes.join(
          ', ',
        )}`,
      );
    }
  }
}
