import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {logger} from '~/utils';
import type {
  IStorageProvider,
  UploadOptions,
  UploadResult,
} from './IStorageProvider';

/**
 * Local File System Storage Provider
 *
 * Stores files in the local filesystem.
 * Suitable for development and small-scale deployments.
 *
 * For production, consider using S3StorageProvider or similar cloud storage.
 */
export class LocalStorageProvider implements IStorageProvider {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  /**
   * @param baseDir - Absolute path to the storage directory
   * @param baseUrl - Base URL for accessing files (e.g., '/uploads' or full domain)
   */
  constructor(baseDir: string, baseUrl: string = '/uploads') {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
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

      // Build full path
      const directory = options.directory || 'tickets';
      const relativePath = path.join(directory, filenameWithExt);
      const fullPath = path.join(this.baseDir, relativePath);

      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, {recursive: true});

      // Write file
      await fs.writeFile(fullPath, buffer);

      logger.info('File uploaded to local storage', {
        path: relativePath,
        size: options.sizeBytes,
        originalName: options.originalName,
      });

      // Generate URL (synchronous for local storage)
      const normalizedPath = relativePath.replace(/\\/g, '/');
      const url = `${this.baseUrl}/${normalizedPath}`;

      return {
        path: normalizedPath,
        url,
        sizeBytes: options.sizeBytes,
      };
    } catch (error) {
      logger.error('Failed to upload file to local storage', {error, options});
      throw new Error(
        `Failed to upload file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.unlink(fullPath);

      logger.info('File deleted from local storage', {path: filePath});
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn('Attempted to delete non-existent file', {path: filePath});
        return false;
      }

      logger.error('Failed to delete file from local storage', {
        error,
        path: filePath,
      });
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async getUrl(filePath: string): Promise<string> {
    console.log(filePath, 'filePath');
    // Normalize Windows backslashes to forward slashes first
    const normalizedFilePath = filePath.replace(/\\/g, '/');

    // Ensure filePath starts with / for proper URL construction
    const normalizedPath = normalizedFilePath.startsWith('/')
      ? normalizedFilePath
      : `/${normalizedFilePath}`;

    // Ensure baseUrl doesn't end with / to avoid double slashes
    const normalizedBaseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;

    const url = `${normalizedBaseUrl}${normalizedPath}`;

    logger.info('Generated URL from storage path', {
      originalPath: filePath,
      normalizedPath,
      baseUrl: this.baseUrl,
      finalUrl: url,
    });

    return url;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getBuffer(filePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      logger.error('Failed to read file from local storage', {
        error,
        path: filePath,
      });
      throw new Error(
        `Failed to read file: ${
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
