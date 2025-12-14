import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import {logger} from '~/utils';
import type {
  IStorageProvider,
  UploadOptions,
  UploadResult,
} from './IStorageProvider';

/**
 * AWS S3 Storage Provider
 *
 * Stores files in AWS S3.
 * Suitable for production deployments with high scalability requirements.
 *
 * Features:
 * - Direct upload to S3
 * - Signed URLs for secure access
 * - CloudFront CDN support (optional)
 * - Automatic content-type detection
 */
export class S3StorageProvider implements IStorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cloudFrontDomain?: string;
  private readonly signedUrlExpiry: number;

  /**
   * @param config - S3 configuration
   * @param config.bucket - S3 bucket name
   * @param config.region - AWS region (e.g., 'us-east-1')
   * @param config.accessKeyId - AWS access key ID
   * @param config.secretAccessKey - AWS secret access key
   * @param config.cloudFrontDomain - Optional CloudFront domain for CDN (e.g., 'dxxxxx.cloudfront.net')
   * @param config.signedUrlExpiry - Signed URL expiry in seconds (default: 3600 = 1 hour)
   */
  constructor(config: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    cloudFrontDomain?: string;
    signedUrlExpiry?: number;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.cloudFrontDomain = config.cloudFrontDomain;
    this.signedUrlExpiry = config.signedUrlExpiry || 3600;

    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    try {
      // Generate unique filename if not provided
      const filename = options.filename || this.generateUniqueFilename();

      // Get file extension from original name or mime type
      const extension = this.getFileExtension(
        options.originalName,
        options.mimeType,
      );
      const filenameWithExt = `${filename}${extension}`;

      // Build S3 key (path)
      const directory = options.directory || 'tickets';
      const key = `${directory}/${filenameWithExt}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimeType,
        ContentLength: options.sizeBytes,
        Metadata: {
          originalName: options.originalName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      logger.info('File uploaded to S3', {
        bucket: this.bucket,
        key,
        size: options.sizeBytes,
        originalName: options.originalName,
      });

      return {
        path: key,
        url: this.getUrl(key),
        sizeBytes: options.sizeBytes,
      };
    } catch (error) {
      logger.error('Failed to upload file to S3', {error, options});
      throw new Error(
        `Failed to upload file to S3: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info('File deleted from S3', {bucket: this.bucket, key});
      return true;
    } catch (error) {
      // S3 DeleteObject doesn't error if object doesn't exist
      // But we'll log it anyway
      logger.warn('Error deleting file from S3', {
        error,
        bucket: this.bucket,
        key,
      });
      return false;
    }
  }

  getUrl(key: string): string {
    if (this.cloudFrontDomain) {
      // Use CloudFront URL if configured (better for CDN)
      return `https://${this.cloudFrontDomain}/${key}`;
    }

    // Use direct S3 URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      // HeadObject throws error if object doesn't exist
      if ((error as any)?.name === 'NotFound') {
        return false;
      }

      logger.error('Error checking file existence in S3', {
        error,
        bucket: this.bucket,
        key,
      });
      throw new Error(
        `Failed to check file existence: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Convert stream to buffer
      const stream = response.Body;
      if (!stream) {
        throw new Error('No data returned from S3');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of stream as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('Failed to read file from S3', {
        error,
        bucket: this.bucket,
        key,
      });
      throw new Error(
        `Failed to read file from S3: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Generate a signed URL for secure temporary access
   * Useful for private buckets or when you want time-limited access
   *
   * @param key - S3 key (path) to the file
   * @param expiresIn - URL expiry in seconds (default: configured signedUrlExpiry)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresIn || this.signedUrlExpiry,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        error,
        bucket: this.bucket,
        key,
      });
      throw new Error(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Generate a unique filename using UUID v4
   */
  private generateUniqueFilename(): string {
    return crypto.randomUUID();
  }

  /**
   * Extract file extension from filename or derive from MIME type
   */
  private getFileExtension(originalName: string, mimeType: string): string {
    // Try to get extension from original filename
    const extFromName = path.extname(originalName);
    if (extFromName) {
      return extFromName;
    }

    // Fallback to MIME type mapping
    const mimeToExt: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip',
    };

    return mimeToExt[mimeType.toLowerCase()] || '';
  }
}
