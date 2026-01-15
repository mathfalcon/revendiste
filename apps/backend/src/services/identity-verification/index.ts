import {
  RekognitionClient,
  DetectTextCommand,
  DetectFacesCommand,
  CompareFacesCommand,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  ChallengeType,
  type TextDetection,
  type GetFaceLivenessSessionResultsCommandOutput,
} from '@aws-sdk/client-rekognition';
import sharp from 'sharp';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY} from '~/config/env';
import {UsersRepository} from '~/repositories/users';
import {
  VerificationAuditRepository,
  type VerificationAuditAction,
  type AuditMetadata,
  type AuditConfidenceScores,
} from '~/repositories/verification-audit';
import type {IStorageProvider} from '~/services/storage/IStorageProvider';
import {ValidationError, MaxAttemptsExceededError} from '~/errors';
import {IDENTITY_VERIFICATION_ERROR_MESSAGES} from '~/constants/error-messages';
import {logger} from '~/utils';
import {getStorageProvider} from '../storage';
import {NotificationService} from '../notifications';
import {
  notifyIdentityVerificationCompleted,
  notifyIdentityVerificationFailed,
  notifyIdentityVerificationManualReview,
} from '../notifications/helpers';

// ============================================================================
// Constants
// ============================================================================

/** Max image dimension for Rekognition - larger images are resized for performance */
const MAX_IMAGE_DIMENSION = 1920;

/** Rekognition region (Face Liveness is only available in specific regions) */
const REKOGNITION_REGION = 'us-west-2';

/** Max verification attempts per user (each session costs ~$0.40) */
const MAX_VERIFICATION_ATTEMPTS = 5;

/** Session expiry time (AWS sessions expire after ~5 minutes, we use 4 as safe threshold) */
const SESSION_EXPIRY_MS = 4 * 60 * 1000;

// Confidence thresholds
const THRESHOLDS = {
  /** Face similarity >= this auto-approves */
  FACE_MATCH_AUTO_APPROVE: 95,
  /** Face similarity >= this goes to manual review, below fails */
  FACE_MATCH_MANUAL_REVIEW: 80,
  /** Liveness confidence >= this auto-approves */
  LIVENESS_AUTO_APPROVE: 95,
  /** Liveness confidence >= this allows retry (if face matches and attempts remaining) */
  LIVENESS_RETRY_THRESHOLD: 90,
  /** Text detection confidence threshold */
  TEXT_DETECTION: 95,
  /** Document image quality threshold */
  DOCUMENT_QUALITY: 40,
} as const;

// ============================================================================
// Types
// ============================================================================

type DocumentType = 'ci_uy' | 'dni_ar' | 'passport';
type VerificationStatus =
  | 'pending'
  | 'requires_manual_review'
  | 'completed'
  | 'failed';

interface VerificationConfidenceScores {
  textDetection?: number;
  documentFaceQuality?: number;
  liveness?: number;
  faceMatch?: number;
}

// Using index signature to satisfy JsonObject constraint from Kysely
interface VerificationMetadata {
  [key: string]: string | number | string[] | undefined;
  livenessSessionId?: string;
  livenessReferenceImagePath?: string;
  livenessAuditImagePaths?: string[];
  livenessProcessedAt?: string;
  failureReason?: string;
  failedAt?: string;
  livenessStatus?: string;
  faceSimilarity?: number;
  sessionId?: string;
  processedAt?: string;
  status?: string;
  // Last liveness attempt tracking (for retry scenarios)
  lastLivenessScore?: number;
  lastLivenessSessionId?: string;
}

interface UserVerificationData {
  id: string;
  documentNumber: string | null;
  documentType: string | null;
  documentCountry: string | null;
  documentImagePath: string | null;
  verificationStatus: string | null;
  verificationAttempts: number | null;
  verificationSessionId: string | null;
  verificationSessionCreatedAt: Date | null;
  verificationConfidenceScores: VerificationConfidenceScores | null;
  verificationMetadata: VerificationMetadata | null;
  manualReviewReason: string | null;
}

/** Result of document identifier extraction with confidence score */
interface DocumentExtractionResult {
  /** The extracted/matched document identifier (can be alphanumeric for passports) */
  documentId: string;
  /** Confidence score of the text detection that matched (0-100) */
  confidence: number;
}

// ============================================================================
// Service
// ============================================================================

export class IdentityVerificationService {
  private rekognitionClient: RekognitionClient;
  private storageProvider: IStorageProvider;
  private auditRepository: VerificationAuditRepository;
  private notificationService: NotificationService;

  constructor(
    private usersRepository: UsersRepository,
    private db: Kysely<DB>,
  ) {
    this.rekognitionClient = this.createRekognitionClient();
    this.storageProvider = getStorageProvider();
    this.auditRepository = new VerificationAuditRepository(db);
    this.notificationService = new NotificationService(db, usersRepository);
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Step 1: Initiate verification by validating and storing document info
   */
  async initiateVerification(
    userId: string,
    documentType: DocumentType,
    documentNumber: string,
    documentCountry?: string,
  ) {
    logger.info('[STEP 1/3] Initiating identity verification', {
      userId,
      documentType,
      documentNumberLength: documentNumber.length,
      documentCountry: documentCountry || 'N/A',
    });

    this.validateDocumentInput(documentType, documentNumber, documentCountry);
    await this.checkDocumentNotAlreadyVerified(
      userId,
      documentType,
      documentNumber,
      documentCountry,
    );

    const finalDocumentCountry = this.getCountryForDocumentType(
      documentType,
      documentCountry,
    );

    await this.usersRepository.updateVerification(userId, {
      documentType,
      documentNumber,
      documentCountry: finalDocumentCountry,
      documentVerified: false,
    });

    // Create audit log for verification initiation
    await this.createAuditLog(
      userId,
      'verification_initiated',
      null,
      'pending',
      null,
      {
        documentType,
        documentCountry: finalDocumentCountry ?? undefined,
      },
    );

    logger.info('[STEP 1/3] ✅ Verification initiated successfully', {
      userId,
      documentType,
      documentCountry: finalDocumentCountry,
    });

    return {success: true, message: 'Verificación iniciada'};
  }

  /**
   * Step 2: Process document image - OCR, face detection, and validation
   */
  async processDocument(
    userId: string,
    documentImage: Buffer,
    documentType: DocumentType,
    mimeType?: string,
  ) {
    logger.info('[STEP 2/3] Processing document image', {
      userId,
      documentType,
      originalImageSize: documentImage.length,
      originalImageSizeMB: (documentImage.length / 1024 / 1024).toFixed(2),
      mimeType: mimeType || 'unknown',
    });

    const user = await this.getUserOrThrow(userId, '[STEP 2/3]');
    if (!user.documentNumber) {
      logger.warn('[STEP 2/3] User has not completed step 1', {userId});
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.MUST_INITIATE_FIRST,
      );
    }

    const processedImage = await this.resizeImageIfNeeded(documentImage);
    const {documentUpload, textDetection, documentFaces} =
      await this.runDocumentAnalysis(userId, processedImage);

    // Extract document ID and get the confidence of the matching text detection
    const extractionResult = this.extractDocumentId(
      textDetection.TextDetections ?? [],
      documentType,
      user.documentNumber ?? undefined, // Pass user-provided ID for passport matching
    );
    this.validateDocumentIdMatch(
      userId,
      user.documentNumber,
      extractionResult.documentId,
      documentType,
    );
    this.validateFaceCountInDocument(
      userId,
      documentFaces.FaceDetails?.length || 0,
      documentType,
    );

    // Get the best quality face (for passports with watermarks, pick the highest quality)
    const bestFace = this.getBestQualityFace(documentFaces.FaceDetails ?? []);

    // Use the confidence from the actual matching text detection (not index 0)
    const textDetectionConfidence = extractionResult.confidence;

    const {verificationStatus, manualReviewReason} =
      this.evaluateDocumentQuality(
        userId,
        textDetectionConfidence,
        bestFace?.Quality?.Brightness || 0,
        bestFace?.Quality?.Sharpness || 0,
      );

    // Use the best face quality (not index 0 which may be the watermark)
    const bestFaceQuality = bestFace?.Quality?.Brightness || 0;

    await this.usersRepository.updateVerification(userId, {
      verificationStatus,
      manualReviewReason,
      documentImagePath: documentUpload.path,
      verificationConfidenceScores: {
        textDetection: textDetectionConfidence,
        documentFaceQuality: bestFaceQuality,
      },
    });

    // Create audit log for document verification
    await this.createAuditLog(
      userId,
      'document_verified',
      'pending',
      verificationStatus,
      {
        textDetection: textDetectionConfidence,
        documentQuality: bestFaceQuality,
      },
      {
        documentImagePath: documentUpload.path,
        extractedDocumentId: extractionResult.documentId,
        documentType,
      },
    );

    logger.info('[STEP 2/3] ✅ Document processing complete', {
      userId,
      verificationStatus,
      documentImagePath: documentUpload.path,
      textDetectionConfidence,
      readyForLiveness: true,
    });

    return {
      extractedDocumentId: extractionResult.documentId,
      readyForLiveness: true,
      verificationStatus,
      documentIdMatch: true,
    };
  }

  /**
   * Step 3a: Create or reuse a liveness session
   */
  async createAndCompleteLivenessCheck(userId: string) {
    logger.info('[STEP 3/3] Starting liveness session creation', {userId});

    const user = await this.getUserOrThrow(userId, '[STEP 3/3]');
    this.validateDocumentVerificationCompleted(userId, user);
    this.validateAttemptsRemaining(userId, user.verificationAttempts || 0);

    const existingSession = await this.tryReuseExistingSession(userId, user);
    if (existingSession) return existingSession;

    return this.createNewLivenessSession(
      userId,
      user.verificationAttempts || 0,
    );
  }

  /**
   * Step 3b: Verify liveness results and compare faces
   *
   * Returns `canRetry: true` if liveness score is borderline (90-95%) and user
   * hasn't exceeded retry limit. Frontend can offer retry option in this case.
   */
  async verifyLivenessResults(
    userId: string,
    sessionId: string,
  ): Promise<{
    verified: boolean;
    status: VerificationStatus;
    message?: string;
    canRetry?: boolean;
    retriesRemaining?: number;
  }> {
    logger.info('[STEP 3/3] Verifying liveness results', {userId, sessionId});

    const results = await this.getLivenessResults(sessionId, userId);
    const user = await this.getUserOrThrow(userId, '[STEP 3/3]');

    if (results.Status !== 'SUCCEEDED') {
      return this.handleLivenessFailed(userId, sessionId, results, user);
    }

    logger.info(
      '[STEP 3/3] ✅ Liveness check SUCCEEDED, proceeding to face comparison',
      {
        userId,
        sessionId,
        livenessConfidence: results.Confidence?.toFixed(2),
      },
    );

    const {
      faceSimilarity,
      faceComparisonError,
      livenessReferenceImagePath,
      livenessAuditImagePaths,
    } = await this.performFaceComparison(userId, sessionId, results, user);

    return this.determineVerificationResult(
      userId,
      sessionId,
      results.Confidence || 0,
      faceSimilarity,
      faceComparisonError,
      user,
      livenessReferenceImagePath,
      livenessAuditImagePaths,
    );
  }

  // ==========================================================================
  // Private: Initialization
  // ==========================================================================

  private createRekognitionClient(): RekognitionClient {
    const config: ConstructorParameters<typeof RekognitionClient>[0] = {
      region: REKOGNITION_REGION,
    };

    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      };
    }

    return new RekognitionClient(config);
  }

  // ==========================================================================
  // Private: User & Validation Helpers
  // ==========================================================================

  private async getUserOrThrow(
    userId: string,
    logPrefix: string,
  ): Promise<UserVerificationData> {
    const user = await this.usersRepository.getById(userId);
    if (!user) {
      logger.warn(`${logPrefix} User not found`, {userId});
      throw new ValidationError('User not found');
    }
    return user as UserVerificationData;
  }

  private validateDocumentInput(
    documentType: DocumentType,
    documentNumber: string,
    documentCountry?: string,
  ): void {
    if (documentType === 'passport' && !documentCountry) {
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_COUNTRY_REQUIRED,
      );
    }

    if (documentType === 'ci_uy') {
      const normalizedCI = this.normalizeDocumentId(documentNumber);
      if (!this.validateCIUruguay(normalizedCI)) {
        throw new ValidationError(
          IDENTITY_VERIFICATION_ERROR_MESSAGES.CI_INVALID,
        );
      }
    }

    if (documentType === 'dni_ar') {
      const normalizedDNI = documentNumber.replace(/\./g, '');
      if (!/^\d{7,8}$/.test(normalizedDNI)) {
        throw new ValidationError(
          IDENTITY_VERIFICATION_ERROR_MESSAGES.DNI_INVALID_FORMAT,
        );
      }
    }
  }

  private async checkDocumentNotAlreadyVerified(
    userId: string,
    documentType: DocumentType,
    documentNumber: string,
    documentCountry?: string,
  ): Promise<void> {
    const lookupCountry =
      this.getCountryForDocumentType(documentType, documentCountry) ??
      undefined;
    const existing = await this.usersRepository.findByDocument(
      documentType,
      documentNumber,
      lookupCountry,
    );

    if (existing && existing.id !== userId) {
      logger.warn('[STEP 1/3] Document already verified by another user', {
        userId,
        existingUserId: existing.id,
        documentType,
      });
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_ALREADY_VERIFIED,
      );
    }
  }

  private validateDocumentVerificationCompleted(
    userId: string,
    user: UserVerificationData,
  ): void {
    const confidenceScores = user.verificationConfidenceScores;
    const isComplete = !!(
      user.documentImagePath && confidenceScores?.textDetection
    );

    if (!isComplete) {
      logger.warn(
        '[STEP 3/3] ❌ User attempted liveness without document verification',
        {
          userId,
          hasDocumentImage: !!user.documentImagePath,
          hasTextDetection: !!confidenceScores?.textDetection,
        },
      );
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_VERIFICATION_REQUIRED,
      );
    }
  }

  private validateAttemptsRemaining(
    userId: string,
    currentAttempts: number,
  ): void {
    logger.info('[STEP 3/3] Rate limit check', {
      userId,
      currentAttempts,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - currentAttempts,
    });

    if (currentAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      logger.warn('[STEP 3/3] ❌ User exceeded max verification attempts', {
        userId,
        attempts: currentAttempts,
      });
      throw new MaxAttemptsExceededError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED,
      );
    }
  }

  private validateDocumentIdMatch(
    userId: string,
    userDocId: string,
    extractedId: string,
    documentType: DocumentType,
  ): void {
    const normalizedUser = this.normalizeDocumentId(userDocId);
    const normalizedExtracted = this.normalizeDocumentId(extractedId);
    const isMatch =
      normalizedUser.toLowerCase() === normalizedExtracted.toLowerCase();

    logger.info('[STEP 2/3] Document ID comparison', {
      userId,
      userProvidedId: normalizedUser,
      extractedFromImage: normalizedExtracted,
      match: isMatch,
    });

    if (!isMatch) {
      logger.warn('[STEP 2/3] ❌ Document ID mismatch', {
        userId,
        userProvided: normalizedUser,
        extractedFromImage: normalizedExtracted,
        documentType,
      });
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_NUMBER_MISMATCH,
      );
    }
  }

  /**
   * Validate face count in document.
   * - For passports: Allow 1-2 faces (main photo + watermark/ghost image)
   * - For other documents: Require exactly 1 face
   */
  private validateFaceCountInDocument(
    userId: string,
    faceCount: number,
    documentType: DocumentType,
  ): void {
    // Passports typically have 2 faces: main photo + watermark
    const maxFaces = documentType === 'passport' ? 2 : 1;

    if (faceCount === 0) {
      logger.warn('[STEP 2/3] ❌ No face detected in document', {
        userId,
        faceCount,
        documentType,
      });
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.FACE_NOT_DETECTED_IN_DOCUMENT,
      );
    }

    if (faceCount > maxFaces) {
      logger.warn('[STEP 2/3] ❌ Too many faces in document', {
        userId,
        faceCount,
        maxAllowed: maxFaces,
        documentType,
      });
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.FACE_NOT_DETECTED_IN_DOCUMENT,
      );
    }

    if (faceCount === 2 && documentType === 'passport') {
      logger.info(
        '[STEP 2/3] Passport has 2 faces (main + watermark) - using best quality',
        {userId, faceCount},
      );
    }
  }

  /**
   * Get the best quality face from detected faces.
   * Uses a combination of brightness and sharpness to determine quality.
   */
  private getBestQualityFace(
    faces: {Quality?: {Brightness?: number; Sharpness?: number}}[],
  ): {Quality?: {Brightness?: number; Sharpness?: number}} | undefined {
    if (faces.length === 0) return undefined;
    if (faces.length === 1) return faces[0];

    // Calculate quality score for each face (average of brightness and sharpness)
    return faces.reduce((best, current) => {
      const bestScore =
        ((best.Quality?.Brightness ?? 0) + (best.Quality?.Sharpness ?? 0)) / 2;
      const currentScore =
        ((current.Quality?.Brightness ?? 0) +
          (current.Quality?.Sharpness ?? 0)) /
        2;

      return currentScore > bestScore ? current : best;
    });
  }

  // ==========================================================================
  // Private: Document Processing
  // ==========================================================================

  private async runDocumentAnalysis(userId: string, processedImage: Buffer) {
    const startTime = Date.now();

    const [documentUpload, textDetection, documentFaces] = await Promise.all([
      this.uploadDocumentImage(userId, processedImage, startTime),
      this.detectText(userId, processedImage, startTime),
      this.detectFaces(userId, processedImage, startTime),
    ]);

    logger.info('[STEP 2/3] All parallel operations completed', {
      userId,
      totalElapsed: `${Date.now() - startTime}ms`,
    });

    return {documentUpload, textDetection, documentFaces};
  }

  private async uploadDocumentImage(
    userId: string,
    image: Buffer,
    startTime: number,
  ) {
    const result = await this.storageProvider.upload(image, {
      directory: `private/users/${userId}/identity-documents`,
      mimeType: 'image/jpeg',
      filename: `document-${Date.now()}`,
      originalName: 'document.jpg',
      sizeBytes: image.length,
    });
    logger.info('R2 upload completed', {
      userId,
      elapsed: `${Date.now() - startTime}ms`,
    });
    return result;
  }

  private async detectText(userId: string, image: Buffer, startTime: number) {
    const result = await this.rekognitionClient.send(
      new DetectTextCommand({Image: {Bytes: image}}),
    );
    logger.info('DetectText completed', {
      userId,
      elapsed: `${Date.now() - startTime}ms`,
      textCount: result.TextDetections?.length || 0,
    });
    return result;
  }

  private async detectFaces(userId: string, image: Buffer, startTime: number) {
    const result = await this.rekognitionClient.send(
      new DetectFacesCommand({Image: {Bytes: image}, Attributes: ['ALL']}),
    );
    logger.info('DetectFaces completed', {
      userId,
      elapsed: `${Date.now() - startTime}ms`,
      faceCount: result.FaceDetails?.length || 0,
    });
    return result;
  }

  private evaluateDocumentQuality(
    userId: string,
    textConfidence: number,
    brightness: number,
    sharpness: number,
  ): {
    verificationStatus: 'pending' | 'requires_manual_review';
    manualReviewReason: string | null;
  } {
    let status: 'pending' | 'requires_manual_review' = 'pending';
    let reason: string | null = null;

    if (textConfidence < THRESHOLDS.TEXT_DETECTION) {
      status = 'requires_manual_review';
      reason = 'Low text detection confidence';
      logger.info('[STEP 2/3] Low text confidence flagged', {
        userId,
        textConfidence,
        threshold: THRESHOLDS.TEXT_DETECTION,
      });
    }

    if (
      brightness < THRESHOLDS.DOCUMENT_QUALITY ||
      sharpness < THRESHOLDS.DOCUMENT_QUALITY
    ) {
      status = 'requires_manual_review';
      reason = this.appendReviewReason(reason, 'Poor document image quality');
      logger.info('[STEP 2/3] Poor document quality flagged', {
        userId,
        brightness,
        sharpness,
      });
    }

    return {verificationStatus: status, manualReviewReason: reason};
  }

  // ==========================================================================
  // Private: Liveness Session Management
  // ==========================================================================

  private async tryReuseExistingSession(
    userId: string,
    user: UserVerificationData,
  ): Promise<{
    sessionId: string;
    region: string;
    expiresInSeconds: number;
    attemptsRemaining: number;
  } | null> {
    const sessionAge = this.getSessionAge(user.verificationSessionCreatedAt);
    const mightBeValid =
      user.verificationSessionId &&
      user.verificationStatus === 'pending' &&
      sessionAge < SESSION_EXPIRY_MS;

    if (!mightBeValid || !user.verificationSessionId) return null;

    try {
      const sessionResults = await this.rekognitionClient.send(
        new GetFaceLivenessSessionResultsCommand({
          SessionId: user.verificationSessionId,
        }),
      );

      if (sessionResults.Status === 'CREATED') {
        logger.info('[STEP 3/3] ✅ Returning existing valid liveness session', {
          userId,
          sessionId: user.verificationSessionId,
          ageSeconds: Math.round(sessionAge / 1000),
        });
        return {
          sessionId: user.verificationSessionId,
          region: REKOGNITION_REGION,
          expiresInSeconds: Math.round((SESSION_EXPIRY_MS - sessionAge) / 1000),
          attemptsRemaining:
            MAX_VERIFICATION_ATTEMPTS - (user.verificationAttempts || 0),
        };
      }

      logger.info(
        '[STEP 3/3] Existing session not reusable, creating new one',
        {
          userId,
          previousStatus: sessionResults.Status,
        },
      );
    } catch (error) {
      logger.warn('[STEP 3/3] Failed to check session status with AWS', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return null;
  }

  private async createNewLivenessSession(
    userId: string,
    currentAttempts: number,
  ) {
    const newAttempts = currentAttempts + 1;
    const challengeType = ChallengeType.FACE_MOVEMENT_CHALLENGE;

    logger.info('[STEP 3/3] Creating NEW liveness session', {
      userId,
      attempt: newAttempts,
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - newAttempts,
      challengeType,
    });

    const createSession = await this.rekognitionClient.send(
      new CreateFaceLivenessSessionCommand({
        Settings: {
          AuditImagesLimit: 4,
          ChallengePreferences: [{Type: challengeType}],
        },
      }),
    );

    await this.usersRepository.updateVerification(userId, {
      verificationSessionId: createSession.SessionId!,
      verificationSessionCreatedAt: new Date(),
      verificationAttempts: newAttempts,
    });

    // Create audit log for liveness session creation
    await this.createAuditLog(
      userId,
      'liveness_session_created',
      'pending',
      'pending',
      null,
      {
        sessionId: createSession.SessionId,
        attemptNumber: newAttempts,
        challengeType,
      },
    );

    logger.info('[STEP 3/3] ✅ Liveness session created successfully', {
      userId,
      sessionId: createSession.SessionId,
      region: REKOGNITION_REGION,
      attempt: newAttempts,
    });

    return {
      sessionId: createSession.SessionId,
      region: REKOGNITION_REGION,
      expiresInSeconds: Math.round(SESSION_EXPIRY_MS / 1000),
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - newAttempts,
    };
  }

  // ==========================================================================
  // Private: Liveness Verification
  // ==========================================================================

  private async getLivenessResults(sessionId: string, userId: string) {
    const startTime = Date.now();
    const results = await this.rekognitionClient.send(
      new GetFaceLivenessSessionResultsCommand({SessionId: sessionId}),
    );

    logger.info('[STEP 3/3] AWS GetFaceLivenessSessionResults response', {
      sessionId,
      userId,
      status: results.Status,
      confidence: results.Confidence?.toFixed(2),
      hasReferenceImage: !!results.ReferenceImage?.Bytes,
      auditImagesCount: results.AuditImages?.length || 0,
      elapsed: `${Date.now() - startTime}ms`,
    });

    return results;
  }

  private async handleLivenessFailed(
    userId: string,
    sessionId: string,
    results: GetFaceLivenessSessionResultsCommandOutput,
    user: UserVerificationData,
  ) {
    logger.warn('[STEP 3/3] ❌ Liveness check failed', {
      userId,
      sessionId,
      status: results.Status,
      confidence: results.Confidence,
    });

    const previousStatus = user.verificationStatus || 'pending';

    await this.usersRepository.updateVerification(userId, {
      verificationStatus: 'failed',
      verificationMetadata: this.mergeMetadata(user.verificationMetadata, {
        failureReason: 'Liveness check failed',
        failedAt: new Date().toISOString(),
        livenessStatus: results.Status,
      }),
    });

    // Create audit log for liveness failure
    await this.createAuditLog(
      userId,
      'liveness_failed',
      previousStatus,
      'failed',
      {liveness: results.Confidence ?? 0},
      {
        sessionId,
        livenessStatus: results.Status ?? 'UNKNOWN',
        attemptNumber: user.verificationAttempts ?? 0,
      },
    );

    if ((user.verificationAttempts || 0) >= 3) {
      logger.warn(
        '[STEP 3/3] Multiple failed attempts, flagging for manual review',
        {
          userId,
          attempts: user.verificationAttempts,
        },
      );

      await this.usersRepository.updateVerification(userId, {
        verificationStatus: 'requires_manual_review',
        manualReviewReason: 'Multiple failed verification attempts',
      });

      // Create audit log for escalation to manual review
      await this.createAuditLog(
        userId,
        'manual_review_required',
        'failed',
        'requires_manual_review',
        {liveness: results.Confidence ?? 0},
        {
          reason: 'Multiple failed verification attempts',
          attemptNumber: user.verificationAttempts ?? 0,
        },
      );

      // Send notification for manual review required (fire-and-forget)
      notifyIdentityVerificationManualReview(this.notificationService, {
        userId,
      }).catch(err => {
        logger.error('Failed to send manual review notification', {
          userId,
          error: err.message,
        });
      });

      return {
        verified: false,
        status: 'requires_manual_review' as const,
        message: IDENTITY_VERIFICATION_ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED,
      };
    }

    // Calculate remaining attempts for notification
    const attemptsRemaining =
      MAX_VERIFICATION_ATTEMPTS - (user.verificationAttempts || 0);

    // Send notification for liveness failure (fire-and-forget, in_app only)
    notifyIdentityVerificationFailed(this.notificationService, {
      userId,
      failureReason: 'No pudimos verificar que sos una persona real',
      attemptsRemaining,
    }).catch(err => {
      logger.error('Failed to send verification failed notification', {
        userId,
        error: err.message,
      });
    });

    return {
      verified: false,
      status: 'failed' as const,
      message: IDENTITY_VERIFICATION_ERROR_MESSAGES.RETRY_AFTER_FAILURE,
    };
  }

  private async performFaceComparison(
    userId: string,
    sessionId: string,
    results: GetFaceLivenessSessionResultsCommandOutput,
    user: UserVerificationData,
  ): Promise<{
    faceSimilarity: number;
    faceComparisonError: string | null;
    livenessReferenceImagePath?: string;
    livenessAuditImagePaths?: string[];
  }> {
    if (!results.ReferenceImage?.Bytes) {
      logger.warn(
        '[STEP 3/3] ⚠️ No reference image bytes in liveness results',
        {sessionId, userId},
      );
      return {
        faceSimilarity: 0,
        faceComparisonError: 'No reference image in liveness results',
      };
    }

    try {
      const referenceImageBuffer = Buffer.from(results.ReferenceImage.Bytes);
      const documentImageBuffer = await this.storageProvider.getBuffer(
        user.documentImagePath || '',
      );

      const {faceSimilarity, error} = await this.compareFaces(
        userId,
        sessionId,
        documentImageBuffer,
        referenceImageBuffer,
      );

      const {referenceImagePath, auditImagePaths} =
        await this.storeVerificationImages(
          userId,
          sessionId,
          referenceImageBuffer,
          results.AuditImages || [],
        );

      return {
        faceSimilarity,
        faceComparisonError: error,
        livenessReferenceImagePath: referenceImagePath,
        livenessAuditImagePaths: auditImagePaths,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        '[STEP 3/3] ❌ Failed to compare faces with liveness image',
        {error: errorMessage, userId, sessionId},
      );
      return {
        faceSimilarity: 0,
        faceComparisonError: `Face comparison error: ${errorMessage}`,
      };
    }
  }

  private async compareFaces(
    userId: string,
    sessionId: string,
    documentImage: Buffer,
    referenceImage: Buffer,
  ): Promise<{faceSimilarity: number; error: string | null}> {
    const startTime = Date.now();
    const faceComparison = await this.rekognitionClient.send(
      new CompareFacesCommand({
        SourceImage: {Bytes: documentImage},
        TargetImage: {Bytes: referenceImage},
        SimilarityThreshold: 0,
      }),
    );

    logger.info('[STEP 3/3] AWS CompareFaces response', {
      userId,
      sessionId,
      elapsed: `${Date.now() - startTime}ms`,
      matchesCount: faceComparison.FaceMatches?.length || 0,
      unmatchedCount: faceComparison.UnmatchedFaces?.length || 0,
    });

    if (faceComparison.FaceMatches?.length) {
      const similarity = faceComparison.FaceMatches[0].Similarity || 0;
      logger.info('[STEP 3/3] ✅ Face match found', {
        userId,
        faceSimilarity: similarity.toFixed(2),
      });
      return {faceSimilarity: similarity, error: null};
    }

    if (faceComparison.UnmatchedFaces?.length) {
      logger.warn('[STEP 3/3] ⚠️ Face detected but no match', {userId});
      return {
        faceSimilarity: 0,
        error: 'Face detected in liveness but no match found in document',
      };
    }

    logger.warn('[STEP 3/3] ⚠️ No faces detected for comparison', {userId});
    return {faceSimilarity: 0, error: 'No face detected in one or both images'};
  }

  private async storeVerificationImages(
    userId: string,
    sessionId: string,
    referenceImage: Buffer,
    auditImages: {Bytes?: Uint8Array; BoundingBox?: any}[],
  ): Promise<{referenceImagePath: string; auditImagePaths: string[]}> {
    const timestamp = Date.now();
    const directory = `private/users/${userId}/identity-documents`;

    // Store reference image
    // Note: Storage provider adds .jpg extension from originalName
    const referenceImagePath = `${directory}/liveness-reference-${timestamp}.jpg`;
    await this.uploadImage(
      referenceImage,
      directory,
      `liveness-reference-${timestamp}`,
      'liveness-reference.jpg',
    );
    logger.info('[STEP 3/3] Reference image saved to R2', {
      userId,
      sessionId,
      path: referenceImagePath,
    });

    // Store audit images
    const auditImagePaths: string[] = [];
    for (let i = 0; i < auditImages.length; i++) {
      const auditImage = auditImages[i];
      if (auditImage.Bytes) {
        const auditImageBuffer = Buffer.from(auditImage.Bytes);
        // Note: Storage provider adds .jpg extension from originalName
        const path = `${directory}/liveness-audit-${timestamp}-${i}.jpg`;
        await this.uploadImage(
          auditImageBuffer,
          directory,
          `liveness-audit-${timestamp}-${i}`,
          `liveness-audit-${i}.jpg`,
        );
        auditImagePaths.push(path);
        logger.info(`[STEP 3/3] Audit image ${i + 1} saved to R2`, {
          userId,
          sessionId,
          path,
        });
      }
    }

    // Return paths instead of updating DB - caller will include in final update
    return {referenceImagePath, auditImagePaths};
  }

  private async uploadImage(
    buffer: Buffer,
    directory: string,
    filename: string,
    originalName: string,
  ): Promise<void> {
    await this.storageProvider.upload(buffer, {
      directory,
      mimeType: 'image/jpeg',
      filename,
      originalName,
      sizeBytes: buffer.length,
    });
  }

  private async determineVerificationResult(
    userId: string,
    sessionId: string,
    livenessConfidence: number,
    faceSimilarity: number,
    faceComparisonError: string | null,
    user: UserVerificationData,
    livenessReferenceImagePath?: string,
    livenessAuditImagePaths?: string[],
  ): Promise<{
    verified: boolean;
    status: VerificationStatus;
    message?: string;
    canRetry?: boolean;
    retriesRemaining?: number;
  }> {
    let finalStatus: 'completed' | 'requires_manual_review' = 'completed';
    let reviewReason = user.manualReviewReason;

    // Evaluate face similarity
    const faceResult = this.evaluateFaceSimilarity(
      userId,
      faceSimilarity,
      faceComparisonError,
    );

    // If face doesn't match at all (< 80%), fail immediately
    if (faceResult.status === 'failed') {
      await this.markVerificationFailed(
        userId,
        user,
        'Face mismatch between document and liveness check',
        faceSimilarity,
      );

      // Create audit log for face mismatch failure
      await this.createAuditLog(
        userId,
        'verification_failed',
        user.verificationStatus || 'pending',
        'failed',
        {liveness: livenessConfidence, faceMatch: faceSimilarity},
        {
          sessionId,
          reason: 'Face mismatch between document and liveness check',
        },
      );

      // Calculate remaining attempts for notification
      const attemptsRemaining =
        MAX_VERIFICATION_ATTEMPTS - (user.verificationAttempts || 0);

      // Send notification for face mismatch failure (fire-and-forget, in_app only)
      notifyIdentityVerificationFailed(this.notificationService, {
        userId,
        failureReason:
          'La foto de tu documento no coincide con la verificación facial',
        attemptsRemaining,
      }).catch(err => {
        logger.error('Failed to send verification failed notification', {
          userId,
          error: err.message,
        });
      });

      return {
        verified: false,
        status: 'failed',
        message: IDENTITY_VERIFICATION_ERROR_MESSAGES.FACE_MISMATCH,
      };
    }

    // Track face match issues for review reason
    if (faceResult.status === 'requires_manual_review') {
      reviewReason = this.appendReviewReason(reviewReason, faceResult.reason!);
    }

    // Evaluate liveness confidence
    const livenessResult = this.evaluateLivenessConfidence(
      userId,
      livenessConfidence,
    );

    // Check retry eligibility:
    // - Liveness >= 90% (borderline, might improve with better conditions)
    // - Face match >= 80% (faces match, so it's the same person)
    // - Attempts < MAX (5)
    const isBorderlineLiveness =
      livenessConfidence >= THRESHOLDS.LIVENESS_RETRY_THRESHOLD &&
      livenessConfidence < THRESHOLDS.LIVENESS_AUTO_APPROVE;
    const faceMatchesWell =
      faceSimilarity >= THRESHOLDS.FACE_MATCH_MANUAL_REVIEW;
    const currentAttempts = user.verificationAttempts || 0;
    const retriesRemaining = MAX_VERIFICATION_ATTEMPTS - currentAttempts;
    const canRetry =
      isBorderlineLiveness && faceMatchesWell && retriesRemaining > 0;

    // If eligible for retry, offer it instead of manual review
    if (canRetry) {
      // Clear session so user can create a new one, but keep status as pending
      // Still store image paths for potential manual review later
      await this.usersRepository.updateVerification(userId, {
        verificationSessionId: null,
        verificationSessionCreatedAt: null,
        verificationMetadata: this.mergeMetadata(user.verificationMetadata, {
          lastLivenessScore: livenessConfidence,
          lastLivenessSessionId: sessionId,
          livenessReferenceImagePath,
          livenessAuditImagePaths,
          livenessProcessedAt: new Date().toISOString(),
        }),
        verificationConfidenceScores: {
          ...(user.verificationConfidenceScores || {}),
          liveness: livenessConfidence,
          faceMatch: faceSimilarity,
        },
      });

      logger.info(
        '[STEP 3/3] Liveness >= 90% with face match, offering retry',
        {
          userId,
          livenessConfidence: livenessConfidence.toFixed(2),
          faceSimilarity: faceSimilarity.toFixed(2),
          currentAttempts,
          retriesRemaining,
        },
      );

      return {
        verified: false,
        status: 'pending',
        // Generic message - never disclose liveness scores to users per AWS guidelines
        message:
          'La verificación no fue exitosa. Puedes intentarlo de nuevo asegurándote de tener buena iluminación.',
        canRetry: true,
        retriesRemaining,
      };
    }

    // If liveness is borderline but exhausted retries, go to manual review
    if (livenessResult.status === 'requires_manual_review') {
      finalStatus = 'requires_manual_review';
      if (isBorderlineLiveness && faceMatchesWell && retriesRemaining <= 0) {
        reviewReason = this.appendReviewReason(
          reviewReason,
          `Borderline liveness (${livenessConfidence.toFixed(
            2,
          )}%) after ${currentAttempts} attempts`,
        );
      } else {
        reviewReason = this.appendReviewReason(
          reviewReason,
          livenessResult.reason!,
        );
      }
    }

    // If face match is borderline (80-95%), add to review reason
    if (faceResult.status === 'requires_manual_review') {
      finalStatus = 'requires_manual_review';
    }

    // Check if already flagged from document processing
    if (user.verificationStatus === 'requires_manual_review') {
      finalStatus = 'requires_manual_review';
    }

    // Update final status (including image paths from storeVerificationImages)
    await this.usersRepository.updateVerification(userId, {
      documentVerified: finalStatus === 'completed',
      verificationStatus: finalStatus,
      documentVerifiedAt: finalStatus === 'completed' ? new Date() : null,
      verificationSessionId: sessionId,
      manualReviewReason: reviewReason,
      verificationConfidenceScores: {
        ...(user.verificationConfidenceScores || {}),
        liveness: livenessConfidence,
        faceMatch: faceSimilarity,
      },
      verificationMetadata: this.mergeMetadata(user.verificationMetadata, {
        sessionId,
        processedAt: new Date().toISOString(),
        status: finalStatus,
        livenessReferenceImagePath,
        livenessAuditImagePaths,
        livenessProcessedAt: new Date().toISOString(),
      }),
    });

    this.logVerificationComplete(
      userId,
      finalStatus,
      user.documentType,
      faceSimilarity,
      livenessConfidence,
      reviewReason,
    );

    // Create audit log for verification completion
    await this.createAuditLog(
      userId,
      finalStatus === 'completed'
        ? 'verification_completed'
        : 'manual_review_required',
      user.verificationStatus || 'pending',
      finalStatus,
      {liveness: livenessConfidence, faceMatch: faceSimilarity},
      {
        sessionId,
        reason: reviewReason ?? undefined,
      },
    );

    if (finalStatus === 'completed') {
      // Send notification for successful verification (fire-and-forget)
      notifyIdentityVerificationCompleted(this.notificationService, {
        userId,
      }).catch(err => {
        logger.error('Failed to send verification completed notification', {
          userId,
          error: err.message,
        });
      });

      return {
        verified: true,
        status: 'completed',
        message: IDENTITY_VERIFICATION_ERROR_MESSAGES.VERIFICATION_SUCCESS,
      };
    }

    // Send notification for manual review required (fire-and-forget)
    notifyIdentityVerificationManualReview(this.notificationService, {
      userId,
    }).catch(err => {
      logger.error('Failed to send manual review notification', {
        userId,
        error: err.message,
      });
    });

    return {
      verified: false,
      status: 'requires_manual_review',
      message:
        IDENTITY_VERIFICATION_ERROR_MESSAGES.VERIFICATION_IN_MANUAL_REVIEW,
      canRetry: false,
    };
  }

  private evaluateFaceSimilarity(
    userId: string,
    faceSimilarity: number,
    error: string | null,
  ): {
    status: 'completed' | 'requires_manual_review' | 'failed';
    reason?: string;
  } {
    if (error || faceSimilarity === 0) {
      const detail = error || 'Face comparison returned no result';
      logger.info(
        '[STEP 3/3] Face comparison error/no result → manual review',
        {userId, errorDetail: detail},
      );
      return {status: 'requires_manual_review', reason: detail};
    }

    if (faceSimilarity < THRESHOLDS.FACE_MATCH_MANUAL_REVIEW) {
      logger.warn('[STEP 3/3] ❌ Face similarity < 80% → FAILED', {
        userId,
        faceSimilarity: faceSimilarity.toFixed(2),
      });
      return {status: 'failed'};
    }

    if (faceSimilarity < THRESHOLDS.FACE_MATCH_AUTO_APPROVE) {
      logger.info('[STEP 3/3] Face similarity 80-95% → manual review', {
        userId,
        faceSimilarity: faceSimilarity.toFixed(2),
      });
      return {
        status: 'requires_manual_review',
        reason: `Face similarity ${faceSimilarity.toFixed(
          1,
        )}% (threshold: 95%)`,
      };
    }

    logger.info('[STEP 3/3] Face similarity >= 95% → OK', {
      userId,
      faceSimilarity: faceSimilarity.toFixed(2),
    });
    return {status: 'completed'};
  }

  private evaluateLivenessConfidence(
    userId: string,
    confidence: number,
  ): {status: 'completed' | 'requires_manual_review'; reason?: string} {
    if (confidence < THRESHOLDS.LIVENESS_RETRY_THRESHOLD) {
      logger.info('[STEP 3/3] Liveness confidence < 90% → manual review', {
        userId,
        confidence: confidence.toFixed(2),
      });
      return {
        status: 'requires_manual_review',
        reason: `Low liveness confidence: ${confidence}%`,
      };
    }

    if (confidence < THRESHOLDS.LIVENESS_AUTO_APPROVE) {
      logger.info('[STEP 3/3] Liveness confidence 90-95% → manual review', {
        userId,
        confidence: confidence.toFixed(2),
      });
      return {
        status: 'requires_manual_review',
        reason: `Borderline liveness confidence: ${confidence}%`,
      };
    }

    logger.info('[STEP 3/3] Liveness confidence >= 95% → OK', {
      userId,
      confidence: confidence.toFixed(2),
    });
    return {status: 'completed'};
  }

  private async markVerificationFailed(
    userId: string,
    user: UserVerificationData,
    reason: string,
    faceSimilarity: number,
  ): Promise<void> {
    await this.usersRepository.updateVerification(userId, {
      verificationStatus: 'failed',
      verificationMetadata: this.mergeMetadata(user.verificationMetadata, {
        failureReason: reason,
        faceSimilarity,
        failedAt: new Date().toISOString(),
      }),
    });
  }

  /**
   * Creates an audit log entry for verification status changes
   */
  private async createAuditLog(
    userId: string,
    action: VerificationAuditAction,
    previousStatus: string | null,
    newStatus: string | null,
    confidenceScores?: AuditConfidenceScores | null,
    metadata?: AuditMetadata | null,
  ): Promise<void> {
    try {
      await this.auditRepository.create({
        userId,
        action,
        previousStatus,
        newStatus,
        confidenceScores,
        metadata,
      });
      logger.info('[AUDIT] Created verification audit log', {
        userId,
        action,
        previousStatus,
        newStatus,
      });
    } catch (error) {
      // Log but don't fail the main operation if audit fails
      logger.error('[AUDIT] Failed to create audit log', {
        userId,
        action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private logVerificationComplete(
    userId: string,
    status: string,
    documentType: string | null,
    faceSimilarity: number,
    livenessConfidence: number,
    reviewReason: string | null,
  ): void {
    logger.info('[STEP 3/3] ===== VERIFICATION COMPLETE =====', {
      userId,
      finalStatus: status,
      documentType,
      confidenceScores: {
        faceMatch: faceSimilarity.toFixed(2),
        liveness: livenessConfidence.toFixed(2),
      },
      reviewReason: reviewReason || 'N/A',
    });

    if (status === 'completed') {
      logger.info('[STEP 3/3] ✅✅✅ VERIFICATION APPROVED ✅✅✅', {
        userId,
        documentType,
      });
    } else {
      logger.info('[STEP 3/3] ⚠️ VERIFICATION REQUIRES MANUAL REVIEW ⚠️', {
        userId,
        reason: reviewReason,
      });
    }
  }

  // ==========================================================================
  // Private: Document Number Extraction & Validation
  // ==========================================================================

  private extractDocumentId(
    textDetections: TextDetection[],
    documentType: DocumentType,
    userProvidedId?: string,
  ): DocumentExtractionResult {
    switch (documentType) {
      case 'ci_uy':
        return this.extractCIUruguay(textDetections);
      case 'dni_ar':
        return this.extractDNIArgentina(textDetections);
      case 'passport':
        return this.extractPassport(textDetections, userProvidedId);
      default:
        throw new ValidationError(
          IDENTITY_VERIFICATION_ERROR_MESSAGES.DOCUMENT_TYPE_NOT_SUPPORTED,
        );
    }
  }

  private extractCIUruguay(
    textDetections: TextDetection[],
  ): DocumentExtractionResult {
    const ciPattern = /\b(\d{1}\.\d{3}\.\d{3}-\d{1}|\d{7,8})\b/;

    // Search through each detection to find the CI and get its confidence
    for (const detection of textDetections) {
      const detectedText = detection.DetectedText ?? '';
      const match = detectedText.match(ciPattern);

      if (match) {
        const fullNumber = match[1].replace(/[.-]/g, '');
        if (this.validateCIUruguay(fullNumber)) {
          logger.info('[STEP 2/3] CI Uruguay found in detected text', {
            foundIn: detection.DetectedText,
            confidence: detection.Confidence,
            extractedId: fullNumber,
          });
          return {
            documentId: fullNumber,
            confidence: detection.Confidence ?? 0,
          };
        }
      }
    }

    // Fallback: search in concatenated text (in case number spans multiple detections)
    const allText = textDetections.map(t => t.DetectedText).join(' ');
    const match = allText.match(ciPattern);

    if (!match) {
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.CI_NOT_DETECTED,
      );
    }

    const fullNumber = match[1].replace(/[.-]/g, '');
    if (!this.validateCIUruguay(fullNumber)) {
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.CI_INVALID_DETECTED,
      );
    }

    // When found via concatenation, use average confidence of all detections
    const avgConfidence =
      textDetections.reduce((sum, d) => sum + (d.Confidence ?? 0), 0) /
      (textDetections.length || 1);

    logger.info(
      '[STEP 2/3] CI Uruguay found via concatenated text (spanning multiple detections)',
      {
        extractedId: fullNumber,
        avgConfidence,
      },
    );

    return {
      documentId: fullNumber,
      confidence: avgConfidence,
    };
  }

  private extractDNIArgentina(
    textDetections: TextDetection[],
  ): DocumentExtractionResult {
    const dniPattern =
      /\b(\d{2}\.\d{3}\.\d{3}|\d{1,2}\.\d{3}\.\d{3}|\d{7,8})\b/;

    // Search through each detection to find the DNI and get its confidence
    for (const detection of textDetections) {
      const detectedText = detection.DetectedText ?? '';
      const match = detectedText.match(dniPattern);

      if (match) {
        const dniNumber = match[1].replace(/\./g, '');
        logger.info('[STEP 2/3] DNI Argentina found in detected text', {
          foundIn: detection.DetectedText,
          confidence: detection.Confidence,
          extractedId: dniNumber,
        });
        return {
          documentId: dniNumber,
          confidence: detection.Confidence ?? 0,
        };
      }
    }

    // Fallback: search in concatenated text (in case number spans multiple detections)
    const allText = textDetections.map(t => t.DetectedText).join(' ');
    const match = allText.match(dniPattern);

    if (!match) {
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.DNI_NOT_DETECTED,
      );
    }

    // When found via concatenation, use average confidence of all detections
    const avgConfidence =
      textDetections.reduce((sum, d) => sum + (d.Confidence ?? 0), 0) /
      (textDetections.length || 1);

    logger.info(
      '[STEP 2/3] DNI Argentina found via concatenated text (spanning multiple detections)',
      {
        extractedId: match[1].replace(/\./g, ''),
        avgConfidence,
      },
    );

    return {
      documentId: match[1].replace(/\./g, ''),
      confidence: avgConfidence,
    };
  }

  /**
   * Extract passport number by searching through all detected text.
   * Strategy:
   * 1. If user provided a number, search for it in all detected text items
   * 2. If found (case-insensitive), return the matched text with its confidence
   * 3. If not found, fall back to regex pattern matching
   */
  private extractPassport(
    textDetections: TextDetection[],
    userProvidedId?: string,
  ): DocumentExtractionResult {
    // Strategy 1: If user provided an ID, search for it in detected text
    if (userProvidedId) {
      const normalizedUserId =
        this.normalizeDocumentId(userProvidedId).toUpperCase();

      // Search through all detected text items for the user-provided ID
      for (const detection of textDetections) {
        const detectedText = detection.DetectedText?.toUpperCase() ?? '';
        const normalizedDetected = this.normalizeDocumentId(detectedText);

        // Check if the detected text contains the user-provided ID
        if (normalizedDetected.includes(normalizedUserId)) {
          logger.info('[STEP 2/3] Passport ID found in detected text', {
            userProvided: userProvidedId,
            foundIn: detection.DetectedText,
            confidence: detection.Confidence,
          });
          return {
            documentId: normalizedUserId,
            confidence: detection.Confidence ?? 0,
          };
        }

        // Also check if user-provided ID contains the detected text
        // (in case OCR splits the ID)
        if (
          normalizedUserId.includes(normalizedDetected) &&
          normalizedDetected.length >= 3
        ) {
          logger.info(
            '[STEP 2/3] Partial passport ID match found in detected text',
            {
              userProvided: userProvidedId,
              partialMatch: detection.DetectedText,
              confidence: detection.Confidence,
            },
          );
        }
      }

      // If user-provided ID not found, log all detected text for debugging
      logger.warn(
        '[STEP 2/3] User-provided passport ID not found in detected text',
        {
          userProvided: userProvidedId,
          allDetectedText: textDetections
            .map(t => t.DetectedText)
            .filter(Boolean)
            .slice(0, 20), // Limit to first 20 items for logging
        },
      );
    }

    // Strategy 2: Fall back to regex pattern matching
    const passportPattern = /\b([A-Z][A-Z0-9]{5,8})\b/;

    // First try to find in individual detections for accurate confidence
    for (const detection of textDetections) {
      const detectedText = detection.DetectedText?.toUpperCase() ?? '';
      const match = detectedText.match(passportPattern);

      if (match) {
        logger.info('[STEP 2/3] Passport ID found via regex in detected text', {
          foundIn: detection.DetectedText,
          confidence: detection.Confidence,
          extractedId: match[1],
        });
        return {
          documentId: match[1],
          confidence: detection.Confidence ?? 0,
        };
      }
    }

    // Fallback: search in concatenated text
    const allText = textDetections.map(t => t.DetectedText).join(' ');
    const match = allText.match(passportPattern);

    if (!match) {
      throw new ValidationError(
        IDENTITY_VERIFICATION_ERROR_MESSAGES.PASSPORT_NOT_DETECTED,
      );
    }

    // When found via concatenation, use average confidence
    const avgConfidence =
      textDetections.reduce((sum, d) => sum + (d.Confidence ?? 0), 0) /
      (textDetections.length || 1);

    logger.info(
      '[STEP 2/3] Passport ID found via concatenated text (spanning multiple detections)',
      {
        extractedId: match[1],
        avgConfidence,
      },
    );

    return {
      documentId: match[1],
      confidence: avgConfidence,
    };
  }

  private validateCIUruguay(ciNumber: string): boolean {
    if (ciNumber.length !== 8) return false;

    const digits = ciNumber.split('').map(Number);
    const checkDigit = digits[7];
    const baseNumber = digits.slice(0, 7);
    const validationVector = [8, 1, 2, 3, 4, 7, 6];

    const sum = baseNumber.reduce(
      (acc, digit, index) => acc + digit * validationVector[index],
      0,
    );
    return sum % 10 === checkDigit;
  }

  // ==========================================================================
  // Private: Utility Helpers
  // ==========================================================================

  private getCountryForDocumentType(
    documentType: DocumentType,
    documentCountry?: string,
  ): string | null {
    switch (documentType) {
      case 'ci_uy':
        return 'URY';
      case 'dni_ar':
        return 'ARG';
      case 'passport':
        return documentCountry ?? null;
    }
  }

  private normalizeDocumentId(id: string): string {
    return id.replace(/[.-]/g, '');
  }

  private getSessionAge(sessionCreatedAt: Date | null): number {
    if (!sessionCreatedAt) return Infinity;
    return Date.now() - new Date(sessionCreatedAt).getTime();
  }

  private appendReviewReason(
    existing: string | null,
    newReason: string,
  ): string {
    return existing ? `${existing}; ${newReason}` : newReason;
  }

  private mergeMetadata(
    existing: VerificationMetadata | null,
    updates: Partial<VerificationMetadata>,
  ): VerificationMetadata {
    return {...(existing || {}), ...updates};
  }

  /**
   * Resize and compress image for optimal Rekognition processing
   */
  private async resizeImageIfNeeded(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const needsResize =
        width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION;

      let pipeline = image;
      if (needsResize) {
        pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const processedBuffer = await pipeline
        .jpeg({quality: 85, mozjpeg: true})
        .toBuffer();

      logger.info('Image processed for Rekognition', {
        originalWidth: width,
        originalHeight: height,
        originalSize: imageBuffer.length,
        newSize: processedBuffer.length,
        wasResized: needsResize,
        compressionRatio: `${Math.round(
          (1 - processedBuffer.length / imageBuffer.length) * 100,
        )}%`,
      });

      return processedBuffer;
    } catch (error) {
      logger.warn('Image processing failed, using original', {
        error: error instanceof Error ? error.message : String(error),
      });
      return imageBuffer;
    }
  }
}
