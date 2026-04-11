import express from 'express';
import {
  Route,
  Post,
  Get,
  Tags,
  Middlewares,
  Request,
  Response,
  UploadedFile,
  FormField,
} from '@mathfalcon/tsoa-runtime';
import multer from 'multer';
import {IdentityVerificationService} from '~/services/identity-verification';
import {NotificationService} from '~/services/notifications';
import {
  UsersRepository,
  VerificationAuditRepository,
  NotificationsRepository,
} from '~/repositories';
import {db} from '~/db';
import {requireAuthMiddleware} from '~/middleware';
import {BadRequestError, ApiErrorResponse} from '~/errors';
import {IDENTITY_VERIFICATION_ERROR_MESSAGES} from '~/constants/error-messages';
import {Body, ValidateBody} from '~/decorators';
import {
  InitiateVerificationRouteBody,
  InitiateVerificationRouteSchema,
  VerifyLivenessRouteBody,
  VerifyLivenessRouteSchema,
} from './validation';
import {getPostHog} from '~/lib/posthog';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

type InitiateVerificationResponse = Awaited<
  ReturnType<IdentityVerificationService['initiateVerification']>
>;

type ProcessDocumentResponse = Awaited<
  ReturnType<IdentityVerificationService['processDocument']>
>;

type CreateLivenessCheckResponse = Awaited<
  ReturnType<IdentityVerificationService['createAndCompleteLivenessCheck']>
>;

type VerifyLivenessResultsResponse = Awaited<
  ReturnType<IdentityVerificationService['verifyLivenessResults']>
>;

type GetLivenessCredentialsResponse = Awaited<
  ReturnType<IdentityVerificationService['getFaceLivenessAwsCredentials']>
>;

// Create shared repositories
const usersRepository = new UsersRepository(db);
const notificationsRepository = new NotificationsRepository(db);
const verificationAuditRepository = new VerificationAuditRepository(db);

// Create notification service
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
);

@Route('identity-verification')
@Tags('Identity Verification')
export class IdentityVerificationController {
  private service = new IdentityVerificationService(
    usersRepository,
    verificationAuditRepository,
    notificationService,
  );

  /**
   * Initiate identity verification process
   *
   * User provides document type, number, and country (for passports).
   * System validates the document format and checks for duplicates.
   */
  @Post('/initiate')
  @Middlewares(requireAuthMiddleware)
  @ValidateBody(InitiateVerificationRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(
    422,
    'Validation failed: Invalid document number, document already verified, or country required for passports',
  )
  public async initiateVerification(
    @Body() body: InitiateVerificationRouteBody,
    @Request() request: express.Request,
  ): Promise<InitiateVerificationResponse> {
    const result = await this.service.initiateVerification(
      request.user.id,
      body.documentType,
      body.documentNumber,
      body.documentCountry,
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'identity_verification_initiated',
      properties: {
        document_type: body.documentType,
        document_country: body.documentCountry,
      },
    });
    return result;
  }

  /**
   * Verify document (upload document photo only)
   *
   * Processes uploaded document image:
   * - Extracts text from document
   * - Detects face in document
   * - Validates document number
   * - Determines if manual review is needed
   *
   * Face comparison will happen during liveness check using the liveness reference image
   */
  @Post('/verify-document')
  @Middlewares(requireAuthMiddleware)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Document is required')
  @Response<ApiErrorResponse>(
    422,
    'Validation failed: Invalid face detection or document number not detected',
  )
  public async verifyDocument(
    @UploadedFile('file') file: Express.Multer.File,
    @FormField() documentType: 'ci_uy' | 'dni_ar' | 'passport',
    @Request() request: express.Request,
  ): Promise<ProcessDocumentResponse> {
    if (!file) {
      throw new BadRequestError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_REQUIRED,
      );
    }

    if (
      !documentType ||
      !['ci_uy', 'dni_ar', 'passport'].includes(documentType)
    ) {
      throw new BadRequestError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_TYPE_INVALID_OR_MISSING,
      );
    }

    const result = await this.service.processDocument(
      request.user.id,
      file.buffer,
      documentType,
      file.mimetype,
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'identity_verification_document_processed',
      properties: {
        document_type: documentType,
        file_type: file.mimetype,
        file_size_bytes: file.size,
      },
    });
    return result;
  }

  /**
   * Start liveness check session
   *
   * Creates an AWS Rekognition Face Liveness session for the user.
   * Returns session ID and region for the frontend to complete the check.
   */
  @Post('/start-liveness')
  @Middlewares(requireAuthMiddleware)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(
    422,
    'Document verification required or user not found',
  )
  @Response<ApiErrorResponse>(429, 'Maximum verification attempts exceeded')
  public async startLiveness(
    @Request() request: express.Request,
  ): Promise<CreateLivenessCheckResponse> {
    return this.service.createAndCompleteLivenessCheck(request.user.id);
  }

  /**
   * Verify liveness results
   *
   * Processes the results of the liveness check:
   * - Validates liveness confidence
   * - Determines if verification is complete or requires manual review
   * - Updates user verification status
   */
  @Post('/verify-liveness')
  @Middlewares(requireAuthMiddleware)
  @ValidateBody(VerifyLivenessRouteSchema)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(
    422,
    'Validation failed: Liveness check failed or low confidence',
  )
  public async verifyLiveness(
    @Body() body: VerifyLivenessRouteBody,
    @Request() request: express.Request,
  ): Promise<VerifyLivenessResultsResponse> {
    const result = await this.service.verifyLivenessResults(
      request.user.id,
      body.sessionId,
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'identity_verification_liveness_completed',
      properties: {
        session_id: body.sessionId,
      },
    });
    return result;
  }

  /**
   * Get temporary AWS credentials for Face Liveness SDK
   *
   * The backend assumes a minimal IAM role that can ONLY call StartFaceLivenessSession.
   * This is more secure than Cognito because credentials are only given to authenticated users.
   * Credentials expire in 15 minutes.
   */
  @Get('/liveness-credentials')
  @Middlewares(requireAuthMiddleware)
  @Response<ApiErrorResponse>(401, 'Authentication required')
  @Response<ApiErrorResponse>(400, 'Face Liveness not configured')
  public async getLivenessCredentials(
    @Request() _request: express.Request,
  ): Promise<GetLivenessCredentialsResponse> {
    return this.service.getFaceLivenessAwsCredentials();
  }
}
