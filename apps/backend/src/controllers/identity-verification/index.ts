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
import {STSClient, AssumeRoleCommand} from '@aws-sdk/client-sts';
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
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  FACE_LIVENESS_ROLE_ARN,
} from '~/config/env';
import {logger} from '~/utils';

// Rekognition region for Face Liveness
const REKOGNITION_REGION = 'us-east-1';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

type InitiateVerificationResponse = ReturnType<
  IdentityVerificationService['initiateVerification']
>;

type ProcessDocumentResponse = ReturnType<
  IdentityVerificationService['processDocument']
>;

type CreateLivenessCheckResponse = ReturnType<
  IdentityVerificationService['createAndCompleteLivenessCheck']
>;

type VerifyLivenessResultsResponse = ReturnType<
  IdentityVerificationService['verifyLivenessResults']
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
    return this.service.initiateVerification(
      request.user.id,
      body.documentType,
      body.documentNumber,
      body.documentCountry,
    );
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

    return this.service.processDocument(
      request.user.id,
      file.buffer,
      documentType,
      file.mimetype,
    );
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
    return this.service.verifyLivenessResults(request.user.id, body.sessionId);
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
  ): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    region: string;
    expiration: string;
  }> {
    if (!FACE_LIVENESS_ROLE_ARN) {
      logger.error('FACE_LIVENESS_ROLE_ARN not configured');
      throw new BadRequestError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.FACE_LIVENESS_NOT_CONFIGURED,
      );
    }

    // Create STS client
    // In EC2/ECS, uses instance/task role automatically
    // In local dev, uses AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
    const stsConfig: ConstructorParameters<typeof STSClient>[0] = {
      region: REKOGNITION_REGION,
    };

    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      stsConfig.credentials = {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      };
    }

    const stsClient = new STSClient(stsConfig);

    try {
      const assumeRoleResponse = await stsClient.send(
        new AssumeRoleCommand({
          RoleArn: FACE_LIVENESS_ROLE_ARN,
          RoleSessionName: `face-liveness-${Date.now()}`,
          DurationSeconds: 900, // 15 minutes
        }),
      );

      if (!assumeRoleResponse.Credentials) {
        throw new Error('No credentials returned from AssumeRole');
      }

      const {AccessKeyId, SecretAccessKey, SessionToken, Expiration} =
        assumeRoleResponse.Credentials;

      if (!AccessKeyId || !SecretAccessKey || !SessionToken) {
        throw new Error('Incomplete credentials from AssumeRole');
      }

      logger.info('Generated Face Liveness credentials via AssumeRole');

      return {
        accessKeyId: AccessKeyId,
        secretAccessKey: SecretAccessKey,
        sessionToken: SessionToken,
        region: REKOGNITION_REGION,
        expiration: Expiration?.toISOString() || '',
      };
    } catch (error) {
      logger.error('Failed to assume Face Liveness role', {error});
      throw new BadRequestError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.FACE_LIVENESS_CREDENTIALS_FAILED,
      );
    }
  }
}
