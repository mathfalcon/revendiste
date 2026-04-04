import express from 'express';
import {
  Route,
  Get,
  Tags,
  Middlewares,
  Request,
  Response,
} from '@mathfalcon/tsoa-runtime';
import {requireAuthMiddleware} from '~/middleware';
import {UnauthorizedError} from '~/errors';

type GetCurrentUserResponse = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: 'user' | 'organizer' | 'admin';
  documentVerified: boolean;
  verificationStatus:
    | 'pending'
    | 'completed'
    | 'requires_manual_review'
    | 'failed'
    | 'rejected'
    | null;
  documentType: 'ci_uy' | 'dni_ar' | 'passport' | null;
  documentNumber: string | null;
  documentCountry: string | null;
  /** Session ID for resuming liveness check on another device */
  verificationSessionId: string | null;
  /** Whether document has been uploaded (step 2 completed) */
  hasDocumentImage: boolean;
  /** Whether document verification step was completed successfully (text/face detected) */
  documentVerificationCompleted: boolean;
  /** Number of verification attempts used (max 5) */
  verificationAttempts: number;
  /** Whether user can retry liveness (has attempts remaining and is in a retryable state) */
  canRetryLiveness: boolean;
  /** Reason for manual review rejection (if rejected by admin) */
  rejectionReason: string | null;
  /** User's phone number in E.164 format */
  phoneNumber: string | null;
  /** Whether user has opted in to WhatsApp notifications */
  whatsappOptedIn: boolean;
};

@Route('users')
@Tags('Users')
export class UsersController {
  @Get('/me')
  @Middlewares(requireAuthMiddleware)
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getCurrentUser(
    @Request() request: express.Request,
  ): Promise<GetCurrentUserResponse> {
    const verificationAttempts = request.user.verificationAttempts || 0;
    const MAX_ATTEMPTS = 5;
    const verificationStatus = request.user.verificationStatus || null;

    // Extract rejection reason from metadata if admin rejected
    const metadata = (request.user.verificationMetadata as {
      manualReview?: {action?: string; reason?: string};
    }) || {};
    const rejectionReason =
      verificationStatus === 'rejected' && metadata.manualReview?.reason
        ? metadata.manualReview.reason
        : null;

    // User can retry liveness if:
    // 1. Has attempts remaining (< MAX_ATTEMPTS)
    // 2. Status allows retry: 'failed', 'rejected', or 'pending'
    // 3. NOT in 'requires_manual_review' (waiting for admin)
    // 4. NOT already 'completed'
    const retryableStatuses: (string | null)[] = [
      'failed',
      'rejected',
      'pending',
      null,
    ];
    const canRetryLiveness =
      verificationAttempts < MAX_ATTEMPTS &&
      retryableStatuses.includes(verificationStatus);

    return {
      id: request.user.id,
      email: request.user.email,
      firstName: request.user.firstName,
      lastName: request.user.lastName,
      imageUrl: request.user.imageUrl,
      role: request.user.role,
      documentVerified: request.user.documentVerified || false,
      verificationStatus,
      documentType: request.user.documentType || null,
      documentNumber: request.user.documentNumber || null,
      documentCountry: request.user.documentCountry || null,
      verificationSessionId: request.user.verificationSessionId || null,
      hasDocumentImage: !!request.user.documentImagePath,
      // Document verification is complete if we have textDetection score in confidence scores
      documentVerificationCompleted: !!(
        request.user.verificationConfidenceScores as {
          textDetection?: number;
        } | null
      )?.textDetection,
      verificationAttempts,
      canRetryLiveness,
      rejectionReason,
      phoneNumber: request.user.phoneNumber ?? null,
      whatsappOptedIn: request.user.whatsappOptedIn ?? false,
    };
  }
}
