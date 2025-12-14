/**
 * Storage Provider Interface
 *
 * This interface defines the contract for file storage operations.
 * It allows us to easily swap between different storage backends
 * (local filesystem, AWS S3, Azure Blob Storage, etc.) without
 * changing the business logic.
 */

export interface UploadOptions {
  /**
   * Original filename from the upload
   */
  originalName: string;

  /**
   * MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
   */
  mimeType: string;

  /**
   * File size in bytes
   */
  sizeBytes: number;

  /**
   * Optional subdirectory within the storage location
   * (e.g., 'tickets', 'documents/2024')
   */
  directory?: string;

  /**
   * Optional custom filename (without extension)
   * If not provided, a unique filename will be generated
   */
  filename?: string;
}

export interface UploadResult {
  /**
   * Relative path or key to the stored file
   * This is what gets stored in the database
   */
  path: string;

  /**
   * Full URL to access the file (if applicable)
   * For local storage, this might be a relative path
   * For S3, this would be the full S3 URL or CloudFront URL
   */
  url: string;

  /**
   * File size in bytes
   */
  sizeBytes: number;
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   * @param buffer - File buffer to upload
   * @param options - Upload options (filename, mime type, etc.)
   * @returns Upload result with path and URL
   */
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param path - Path or key of the file to delete
   * @returns True if file was deleted, false if it didn't exist
   */
  delete(path: string): Promise<boolean>;

  /**
   * Get the public URL for a file
   * @param path - Path or key of the file
   * @returns Full URL to access the file
   */
  getUrl(path: string): string;

  /**
   * Check if a file exists
   * @param path - Path or key of the file
   * @returns True if file exists, false otherwise
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file buffer (for downloading/serving files)
   * @param path - Path or key of the file
   * @returns File buffer
   */
  getBuffer(path: string): Promise<Buffer>;
}
