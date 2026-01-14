import type {Kysely, Insertable} from 'kysely';
import type {DB, VerificationAuditLogs} from '@revendiste/shared';
import {BaseRepository} from '../base';

/**
 * Possible audit actions for verification status changes
 */
export type VerificationAuditAction =
  | 'verification_initiated'
  | 'document_submitted'
  | 'document_verified'
  | 'document_rejected'
  | 'liveness_session_created'
  | 'liveness_completed'
  | 'liveness_failed'
  | 'status_change'
  | 'admin_approved'
  | 'admin_rejected'
  | 'manual_review_required'
  | 'verification_completed'
  | 'verification_failed';

/**
 * Metadata structure for audit log entries
 */
export interface AuditMetadata {
  adminId?: string;
  reason?: string;
  sessionId?: string;
  attemptNumber?: number;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

/**
 * Confidence scores snapshot at the time of audit
 */
export interface AuditConfidenceScores {
  liveness?: number;
  faceMatch?: number;
  textDetection?: number;
  documentQuality?: number;
  [key: string]: number | undefined;
}

export class VerificationAuditRepository extends BaseRepository<VerificationAuditRepository> {
  withTransaction(trx: Kysely<DB>): VerificationAuditRepository {
    return new VerificationAuditRepository(trx);
  }

  /**
   * Creates a new audit log entry
   */
  async create(data: {
    userId: string;
    action: VerificationAuditAction;
    previousStatus?: string | null;
    newStatus?: string | null;
    confidenceScores?: AuditConfidenceScores | null;
    metadata?: AuditMetadata | null;
  }) {
    const insertData: Insertable<VerificationAuditLogs> = {
      userId: data.userId,
      action: data.action,
      previousStatus: data.previousStatus ?? null,
      newStatus: data.newStatus ?? null,
      confidenceScores: data.confidenceScores as Insertable<VerificationAuditLogs>['confidenceScores'] ?? null,
      metadata: data.metadata as Insertable<VerificationAuditLogs>['metadata'] ?? null,
    };

    const [result] = await this.db
      .insertInto('verificationAuditLogs')
      .values(insertData)
      .returningAll()
      .execute();

    return result;
  }

  /**
   * Gets all audit logs for a specific user, ordered by creation date descending
   */
  async getByUserId(userId: string, limit = 50, offset = 0) {
    return await this.db
      .selectFrom('verificationAuditLogs')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  /**
   * Gets the most recent audit log entry for a user
   */
  async getLatestByUserId(userId: string) {
    return await this.db
      .selectFrom('verificationAuditLogs')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * Gets audit logs by action type
   */
  async getByAction(action: VerificationAuditAction, limit = 50, offset = 0) {
    return await this.db
      .selectFrom('verificationAuditLogs')
      .selectAll()
      .where('action', '=', action)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  /**
   * Counts audit logs for a specific user
   */
  async countByUserId(userId: string) {
    const result = await this.db
      .selectFrom('verificationAuditLogs')
      .select(eb => eb.fn.countAll<number>().as('count'))
      .where('userId', '=', userId)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  /**
   * Gets audit logs within a date range
   */
  async getByDateRange(startDate: Date, endDate: Date, limit = 100, offset = 0) {
    return await this.db
      .selectFrom('verificationAuditLogs')
      .selectAll()
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }
}
