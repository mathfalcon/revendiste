import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {TICKET_REPORT_ERROR_MESSAGES} from '~/constants/error-messages';
import {logger} from '~/utils';
import type {TicketReportAttachmentsRepository} from '~/repositories/ticket-report-attachments';
import type {TicketReportsRepository} from '~/repositories/ticket-reports';
import type {IStorageProvider} from '~/services/storage/IStorageProvider';

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

const ALL_ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_DIMENSION = 1600; // Evidence photos don't need more than 1600px

export class TicketReportAttachmentsService {
  constructor(
    private readonly attachmentsRepository: TicketReportAttachmentsRepository,
    private readonly reportsRepository: TicketReportsRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadAttachment(
    reportId: string,
    userId: string,
    isAdmin: boolean,
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    },
    actionId?: string,
  ) {
    const report = await this.reportsRepository.getById(reportId);
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    if (!isAdmin && report.reportedByUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      );
    }

    if (report.status === 'closed') {
      throw new ValidationError(
        TICKET_REPORT_ERROR_MESSAGES.ATTACHMENT_CASE_CLOSED,
      );
    }

    // Validate MIME type
    if (!ALL_ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new ValidationError(
        TICKET_REPORT_ERROR_MESSAGES.ATTACHMENT_INVALID_TYPE,
      );
    }

    // Validate size based on type
    const isImage = IMAGE_MIME_TYPES.includes(file.mimeType);
    if (isImage && file.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new ValidationError(
        TICKET_REPORT_ERROR_MESSAGES.ATTACHMENT_IMAGE_TOO_LARGE,
      );
    }
    if (!isImage && file.sizeBytes > MAX_VIDEO_SIZE_BYTES) {
      throw new ValidationError(
        TICKET_REPORT_ERROR_MESSAGES.ATTACHMENT_VIDEO_TOO_LARGE,
      );
    }

    // Compress images
    let processedBuffer = file.buffer;
    let processedMimeType = file.mimeType;
    let processedSize = file.sizeBytes;

    if (isImage) {
      try {
        processedBuffer = await sharp(file.buffer)
          .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({quality: 80, effort: 4})
          .toBuffer();
        processedMimeType = 'image/webp';
        processedSize = processedBuffer.length;
      } catch (err) {
        logger.warn('Failed to compress image, storing original', {
          reportId,
          error: err,
        });
        // Fall through with original buffer
      }
    }

    const uniqueId = crypto.randomUUID();
    const ext = processedMimeType === 'image/webp'
      ? '.webp'
      : path.extname(file.originalName) || this.mimeToExtension(processedMimeType);
    const fileName = `${uniqueId}${ext}`;

    const uploadResult = await this.storageProvider.upload(processedBuffer, {
      originalName: file.originalName,
      mimeType: processedMimeType,
      sizeBytes: processedSize,
      directory: `private/ticket-reports/${reportId}`,
      filename: uniqueId,
    });

    const attachment = await this.attachmentsRepository.create({
      ticketReportId: reportId,
      uploadedByUserId: userId,
      storagePath: uploadResult.path,
      fileName,
      originalName: file.originalName,
      mimeType: processedMimeType,
      sizeBytes: processedSize,
      ticketReportActionId: actionId,
    });

    logger.info('Ticket report attachment uploaded', {
      reportId,
      attachmentId: attachment.id,
      originalSize: file.sizeBytes,
      processedSize,
      mimeType: processedMimeType,
    });

    return attachment;
  }

  async getAttachmentsByReportId(
    reportId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const report = await this.reportsRepository.getById(reportId);
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    if (!isAdmin && report.reportedByUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      );
    }

    const attachments =
      await this.attachmentsRepository.getByReportId(reportId);

    const attachmentsWithUrls = await Promise.all(
      attachments.map(async attachment => ({
        ...attachment,
        url: await this.storageProvider.getUrl(attachment.storagePath),
      })),
    );

    return attachmentsWithUrls;
  }

  async getAttachmentUrl(
    attachmentId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const attachment = await this.attachmentsRepository.getById(attachmentId);
    if (!attachment) {
      throw new NotFoundError(
        TICKET_REPORT_ERROR_MESSAGES.ATTACHMENT_NOT_FOUND,
      );
    }

    const report = await this.reportsRepository.getById(
      attachment.ticketReportId,
    );
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    if (!isAdmin && report.reportedByUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      );
    }

    const url = await this.storageProvider.getUrl(attachment.storagePath);
    return {url};
  }

  async deleteAttachment(
    attachmentId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const attachment = await this.attachmentsRepository.getById(attachmentId);
    if (!attachment) {
      throw new NotFoundError(
        TICKET_REPORT_ERROR_MESSAGES.ATTACHMENT_NOT_FOUND,
      );
    }

    const report = await this.reportsRepository.getById(
      attachment.ticketReportId,
    );
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    if (!isAdmin && report.reportedByUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      );
    }

    await this.storageProvider.delete(attachment.storagePath);
    await this.attachmentsRepository.deleteById(attachmentId);

    logger.info('Ticket report attachment deleted', {
      attachmentId,
      reportId: attachment.ticketReportId,
    });
  }

  private mimeToExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
      'image/heif': '.heif',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
    };
    return map[mimeType] || '';
  }
}
