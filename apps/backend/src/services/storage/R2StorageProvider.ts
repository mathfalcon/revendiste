import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {Readable} from 'stream';
import crypto from 'crypto';
import path from 'path';
import {logger} from '~/utils';
import type {
  IStorageProvider,
  UploadOptions,
  UploadResult,
} from './IStorageProvider';

/**
 * Cloudflare R2 Storage Provider
 *
 * Stores files in Cloudflare R2 (S3-compatible object storage).
 * Supports both public and private buckets.
 *
 * Features:
 * - Direct upload to R2
 * - Signed URLs for private bucket access
 * - Cloudflare CDN support via custom domain
 * - Automatic content-type detection
 * - Public bucket for assets (website assets, event images, etc.)
 * - Private bucket for sensitive documents
 */
export class R2StorageProvider implements IStorageProvider {
  private readonly publicClient: S3Client;
  private readonly privateClient: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly accountId: string;
  private readonly cdnDomain?: string;
  private readonly signedUrlExpiry: number;

  /**
   * @param config - R2 configuration
   * @param config.publicBucket - R2 public bucket name (for assets, website files, event images)
   * @param config.privateBucket - R2 private bucket name (for documents, sensitive files)
   * @param config.accountId - Cloudflare account ID
   * @param config.accessKeyId - R2 access key ID
   * @param config.secretAccessKey - R2 secret access key
   * @param config.cdnDomain - Optional CDN domain (e.g., 'cdn-dev.revendiste.com')
   * @param config.signedUrlExpiry - Signed URL expiry in seconds (default: 3600 = 1 hour)
   */
  constructor(config: {
    publicBucket: string;
    privateBucket: string;
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    cdnDomain?: string;
    signedUrlExpiry?: number;
  }) {
    this.publicBucket = config.publicBucket;
    this.privateBucket = config.privateBucket;
    this.accountId = config.accountId;
    this.cdnDomain = config.cdnDomain;
    this.signedUrlExpiry = config.signedUrlExpiry || 3600;

    // R2 endpoint format: https://<account-id>.r2.cloudflarestorage.com
    const r2Endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

    const s3Config = {
      region: 'auto', // R2 uses 'auto' as the region
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    // Both buckets use the same client (same endpoint and credentials)
    this.publicClient = new S3Client(s3Config);
    this.privateClient = new S3Client(s3Config);
  }

  /**
   * Upload a file to R2
   * @param buffer - File buffer to upload
   * @param options - Upload options
   * Directory must start with 'public/' or 'private/' to specify bucket.
   * Defaults to 'private/' if no prefix is provided.
   */
  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    try {
      // Determine bucket type based on explicit prefix
      // Paths must start with 'public/' or 'private/' for clarity
      let directory = options.directory || 'private/files';

      // Ensure directory starts with public/ or private/
      if (
        !directory.startsWith('public/') &&
        !directory.startsWith('private/')
      ) {
        // Default to private for security if no prefix specified
        directory = `private/${directory}`;
      }

      const bucketType = directory.startsWith('public/') ? 'public' : 'private';

      const bucket =
        bucketType === 'public' ? this.publicBucket : this.privateBucket;
      const client =
        bucketType === 'public' ? this.publicClient : this.privateClient;

      // Generate unique filename if not provided
      const filename = options.filename || this.generateUniqueFilename();

      // Get file extension from original name or mime type
      const extension = this.getFileExtension(
        options.originalName,
        options.mimeType,
      );
      const filenameWithExt = `${filename}${extension}`;

      // Build R2 key (path) - keep the public/ or private/ prefix for clarity
      const key = `${directory}/${filenameWithExt}`;

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimeType,
        ContentLength: options.sizeBytes,
        Metadata: {
          originalName: options.originalName,
          uploadedAt: new Date().toISOString(),
          bucketType,
        },
      });

      await client.send(command);

      logger.info('File uploaded to R2', {
        bucket,
        bucketType,
        key,
        size: options.sizeBytes,
        originalName: options.originalName,
      });

      const placeholderUrl =
        bucketType === 'public' && this.cdnDomain
          ? `https://${this.cdnDomain}/${key}`
          : `r2://${
              bucketType === 'public' ? this.publicBucket : this.privateBucket
            }/${key}`;

      return {
        path: key,
        url: placeholderUrl,
        sizeBytes: options.sizeBytes,
      };
    } catch (error) {
      logger.error('Failed to upload file to R2', {error, options});
      throw new Error(
        `Failed to upload file to R2: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete a file from R2
   * @param path - Path or key of the file to delete
   */
  async delete(path: string): Promise<boolean> {
    try {
      const bucketType = this.inferBucketType(path);
      const bucket =
        bucketType === 'public' ? this.publicBucket : this.privateBucket;
      const client =
        bucketType === 'public' ? this.publicClient : this.privateClient;

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      await client.send(command);

      logger.info('File deleted from R2', {bucket, bucketType, key: path});
      return true;
    } catch (error) {
      const bucketType = this.inferBucketType(path);
      logger.warn('Error deleting file from R2', {
        error,
        bucket: bucketType,
        key: path,
      });
      return false;
    }
  }

  async getUrl(path: string): Promise<string> {
    const bucketType = this.inferBucketType(path);

    if (bucketType === 'private') {
      return await this.getSignedUrl(path);
    }

    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${path}`;
    }

    return `https://${this.accountId}.r2.cloudflarestorage.com/${this.publicBucket}/${path}`;
  }

  /**
   * Check if a file exists
   * @param path - Path or key of the file
   */
  async exists(path: string): Promise<boolean> {
    try {
      const bucketType = this.inferBucketType(path);
      const bucket =
        bucketType === 'public' ? this.publicBucket : this.privateBucket;
      const client =
        bucketType === 'public' ? this.publicClient : this.privateClient;

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      await client.send(command);
      return true;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'NotFound'
      ) {
        return false;
      }

      const bucketType = this.inferBucketType(path);
      logger.error('Error checking file existence in R2', {
        error,
        bucket: bucketType,
        key: path,
      });
      throw new Error(
        `Failed to check file existence: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get file buffer (for downloading/serving files)
   * @param path - Path or key of the file
   */
  async getBuffer(path: string): Promise<Buffer> {
    try {
      const bucketType = this.inferBucketType(path);
      const bucket =
        bucketType === 'public' ? this.publicBucket : this.privateBucket;
      const client =
        bucketType === 'public' ? this.publicClient : this.privateClient;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      const response = await client.send(command);

      // Convert stream to buffer
      const stream = response.Body;
      if (!stream) {
        throw new Error('No data returned from R2');
      }

      const chunks: Uint8Array[] = [];
      if (stream instanceof Readable) {
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      } else {
        const arrayBuffer = await (stream as Blob).arrayBuffer();
        chunks.push(new Uint8Array(arrayBuffer));
      }

      return Buffer.concat(chunks);
    } catch (error) {
      const bucketType = this.inferBucketType(path);
      logger.error('Failed to read file from R2', {
        error,
        bucket: bucketType,
        key: path,
      });
      throw new Error(
        `Failed to read file from R2: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Generate a signed URL for secure temporary access to private files
   * Useful for private bucket files that need time-limited access
   *
   * @param path - R2 key (path) to the file
   * @param expiresIn - URL expiry in seconds (default: configured signedUrlExpiry)
   * @returns Signed URL
   */
  async getSignedUrl(path: string, expiresIn?: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.privateBucket,
        Key: path,
      });

      const signedUrl = await getSignedUrl(this.privateClient, command, {
        expiresIn: expiresIn || this.signedUrlExpiry,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        error,
        bucket: this.privateBucket,
        key: path,
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

  private inferBucketType(path: string): 'public' | 'private' {
    if (path.startsWith('public/')) {
      return 'public';
    }
    if (path.startsWith('private/')) {
      return 'private';
    }
    // Default to private for security if prefix is missing
    return 'private';
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
