import type {Kysely} from 'kysely';
import type {DB, VerificationStatusEnum} from '@revendiste/shared';
import {UsersRepository} from '~/repositories/users';
import {VerificationAuditRepository} from '~/repositories/verification-audit';
import type {IStorageProvider} from '~/services/storage/IStorageProvider';
import {NotFoundError, ValidationError} from '~/errors';
import {logger} from '~/utils';
import {getStorageProvider} from '../storage';
import {NotificationService} from '../notifications';
import {
  notifyIdentityVerificationCompleted,
  notifyIdentityVerificationRejected,
} from '../notifications/helpers';

interface PaginationParams {
  page: number;
  limit: number;
}

interface VerificationFilters {
  status?: VerificationStatusEnum;
  sortBy?: 'createdAt' | 'updatedAt' | 'verificationAttempts';
  sortOrder?: 'asc' | 'desc';
}

export class AdminIdentityVerificationService {
  private storageProvider: IStorageProvider;
  private auditRepository: VerificationAuditRepository;
  private notificationService: NotificationService;

  constructor(
    private usersRepository: UsersRepository,
    private db: Kysely<DB>,
  ) {
    this.storageProvider = getStorageProvider();
    this.auditRepository = new VerificationAuditRepository(db);
    this.notificationService = new NotificationService(db, usersRepository);
  }

  /**
   * Get list of verifications for admin review with pagination
   */
  async getVerificationsForReview(
    pagination: PaginationParams,
    filters: VerificationFilters,
  ) {
    const {page, limit} = pagination;
    const offset = (page - 1) * limit;

    // Get users that need review or match the filter
    const users = await this.usersRepository.getVerificationsForAdmin({
      limit,
      offset,
      status: filters.status,
      sortBy: filters.sortBy || 'updatedAt',
      sortOrder: filters.sortOrder || 'desc',
    });

    const total = await this.usersRepository.countVerificationsForAdmin({
      status: filters.status,
    });

    return {
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        documentCountry: user.documentCountry,
        verificationStatus: user.verificationStatus,
        verificationAttempts: user.verificationAttempts,
        manualReviewReason: user.manualReviewReason,
        verificationConfidenceScores: user.verificationConfidenceScores,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + users.length < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get detailed verification info for a specific user
   */
  async getVerificationDetails(userId: string) {
    const user = await this.usersRepository.getById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Parse verification metadata to get image paths
    const metadata = (user.verificationMetadata as any) || {};
    const confidenceScores = (user.verificationConfidenceScores as any) || {};

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      documentCountry: user.documentCountry,
      verificationStatus: user.verificationStatus,
      verificationAttempts: user.verificationAttempts,
      manualReviewReason: user.manualReviewReason,
      documentVerified: user.documentVerified,
      documentVerifiedAt: user.documentVerifiedAt,
      // Confidence scores for admin review
      confidenceScores: {
        textDetection: confidenceScores.textDetection || null,
        faceMatch: confidenceScores.faceMatch || null,
        liveness: confidenceScores.liveness || null,
      },
      // Image availability (admin will request URLs separately)
      images: {
        hasDocumentImage: !!user.documentImagePath,
        hasReferenceImage: !!metadata.livenessReferenceImagePath,
        auditImagesCount: metadata.livenessAuditImagePaths?.length || 0,
      },
      // Metadata for context
      metadata: {
        livenessSessionId: metadata.livenessSessionId || null,
        processedAt: metadata.livenessProcessedAt || null,
        failureReason: metadata.failureReason || null,
        failedAt: metadata.failedAt || null,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get a signed URL for viewing verification images
   */
  async getVerificationImageUrl(
    userId: string,
    imageType: 'document' | 'reference' | 'audit',
    auditIndex?: number,
  ) {
    const user = await this.usersRepository.getById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const metadata = (user.verificationMetadata as any) || {};
    let imagePath: string | null = null;

    switch (imageType) {
      case 'document':
        imagePath = user.documentImagePath;
        break;
      case 'reference':
        imagePath = metadata.livenessReferenceImagePath;
        break;
      case 'audit':
        if (
          metadata.livenessAuditImagePaths &&
          auditIndex !== undefined &&
          auditIndex >= 0 &&
          auditIndex < metadata.livenessAuditImagePaths.length
        ) {
          imagePath = metadata.livenessAuditImagePaths[auditIndex];
        }
        break;
    }

    if (!imagePath) {
      throw new NotFoundError('Imagen no encontrada');
    }

    // Generate a signed URL for the image (valid for 15 minutes)
    if (!this.storageProvider.getSignedUrl) {
      throw new ValidationError(
        'El proveedor de almacenamiento no soporta URLs firmadas',
      );
    }

    const signedUrl = await this.storageProvider.getSignedUrl(
      imagePath,
      15 * 60,
    );

    return {
      url: signedUrl,
      expiresIn: 15 * 60, // seconds
    };
  }

  /**
   * Approve a verification that's pending manual review
   */
  async approveVerification(userId: string, adminId: string, notes?: string) {
    const user = await this.usersRepository.getById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (user.verificationStatus !== 'requires_manual_review') {
      throw new ValidationError(
        'El usuario no está pendiente de revisión manual',
      );
    }

    const previousStatus = user.verificationStatus;
    const confidenceScores = (user.verificationConfidenceScores as any) || {};

    logger.info('[Admin] Approving verification', {
      userId,
      adminId,
      previousStatus,
      notes,
    });

    const metadata = (user.verificationMetadata as any) || {};

    await this.usersRepository.updateVerification(userId, {
      documentVerified: true,
      verificationStatus: 'completed',
      documentVerifiedAt: new Date(),
      manualReviewReason: null,
      verificationMetadata: {
        ...metadata,
        manualReview: {
          action: 'approved',
          adminId,
          notes: notes || null,
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    // Create audit log for admin approval
    await this.auditRepository.create({
      userId,
      action: 'admin_approved',
      previousStatus,
      newStatus: 'completed',
      confidenceScores: {
        liveness: confidenceScores.liveness,
        faceMatch: confidenceScores.faceMatch,
      },
      metadata: {
        adminId,
        notes: notes ?? undefined,
      },
    });

    logger.info('[Admin] Verification approved', {userId, adminId});

    // Send notification for successful verification (fire-and-forget)
    notifyIdentityVerificationCompleted(this.notificationService, {
      userId,
    }).catch(err => {
      logger.error(
        '[Admin] Failed to send verification completed notification',
        {
          userId,
          error: err.message,
        },
      );
    });

    return {
      success: true,
      message: 'Verificación aprobada exitosamente',
    };
  }

  /**
   * Reject a verification that's pending manual review
   * Uses 'rejected' status to differentiate from system failures
   */
  async rejectVerification(userId: string, adminId: string, reason: string) {
    const user = await this.usersRepository.getById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (user.verificationStatus !== 'requires_manual_review') {
      throw new ValidationError(
        'El usuario no está pendiente de revisión manual',
      );
    }

    const previousStatus = user.verificationStatus;
    const confidenceScores = (user.verificationConfidenceScores as any) || {};

    logger.info('[Admin] Rejecting verification', {
      userId,
      adminId,
      previousStatus,
      reason,
    });

    const metadata = (user.verificationMetadata as any) || {};

    // Use 'rejected' status to differentiate from system failures ('failed')
    await this.usersRepository.updateVerification(userId, {
      documentVerified: false,
      verificationStatus: 'rejected',
      manualReviewReason: `Rechazado por admin: ${reason}`,
      verificationMetadata: {
        ...metadata,
        manualReview: {
          action: 'rejected',
          adminId,
          reason,
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    // Create audit log for admin rejection
    await this.auditRepository.create({
      userId,
      action: 'admin_rejected',
      previousStatus,
      newStatus: 'rejected',
      confidenceScores: {
        liveness: confidenceScores.liveness,
        faceMatch: confidenceScores.faceMatch,
      },
      metadata: {
        adminId,
        reason,
      },
    });

    logger.info('[Admin] Verification rejected', {userId, adminId, reason});

    // Send notification for rejected verification (fire-and-forget)
    // User can retry since rejection doesn't count as a failed attempt
    notifyIdentityVerificationRejected(this.notificationService, {
      userId,
      rejectionReason: reason,
      canRetry: true,
    }).catch(err => {
      logger.error(
        '[Admin] Failed to send verification rejected notification',
        {
          userId,
          error: err.message,
        },
      );
    });

    return {
      success: true,
      message: 'Verificación rechazada',
    };
  }

  /**
   * Get audit history for a specific user
   */
  async getVerificationAuditHistory(userId: string, limit = 50, offset = 0) {
    const user = await this.usersRepository.getById(userId);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const logs = await this.auditRepository.getByUserId(userId, limit, offset);
    const total = await this.auditRepository.countByUserId(userId);

    return {
      data: logs,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }
}
