import crypto from 'crypto';
import sharp from 'sharp';
import {getStorageProvider} from '../storage';
import {logger} from '~/utils';
import type {ScrapedImageType} from './base/types';

interface ImageDownloadResult {
  buffer: Buffer;
  mimeType: string;
  originalUrl: string;
}

interface ProcessedImage {
  type: ScrapedImageType;
  url: string;
  externalUrl: string;
}

export class EventImageService {
  private readonly storageProvider = getStorageProvider();

  async processImages(
    images: Array<{type: ScrapedImageType; url: string}>,
    eventId: string,
  ): Promise<ProcessedImage[]> {
    const processedImages: ProcessedImage[] = [];

    for (const image of images) {
      if (!image.url || image.url.trim() === '') {
        continue;
      }

      try {
        const processed = await this.processImage(
          image.url,
          image.type,
          eventId,
        );
        processedImages.push(processed);
      } catch (error) {
        logger.error('Failed to process event image', {
          error,
          imageUrl: image.url,
          eventId,
        });
      }
    }

    return processedImages;
  }

  private async processImage(
    externalUrl: string,
    imageType: ScrapedImageType,
    eventId: string,
  ): Promise<ProcessedImage> {
    const imageHash = this.generateImageHash(externalUrl);
    const directory = `public/assets/events/${eventId}`;
    const filename = `${imageType}-${imageHash}`;
    const storagePath = `${directory}/${filename}.webp`;

    const existingImage = await this.checkExistingImage(storagePath);
    if (existingImage) {
      logger.debug('Image already exists in storage, skipping upload', {
        storagePath,
        externalUrl,
        eventId,
      });
      return {
        type: imageType,
        url: existingImage,
        externalUrl,
      };
    }

    const {buffer: originalBuffer} = await this.downloadImage(externalUrl);
    const compressedBuffer = await this.compressImage(originalBuffer);

    const compressionRatio = (
      (1 - compressedBuffer.length / originalBuffer.length) *
      100
    ).toFixed(1);
    logger.info('Compressed event image', {
      originalSize: originalBuffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      eventId,
    });

    const uploadResult = await this.storageProvider.upload(compressedBuffer, {
      originalName: `${imageType}.webp`,
      mimeType: 'image/webp',
      sizeBytes: compressedBuffer.length,
      directory,
      filename,
    });

    logger.info('Uploaded event image to storage', {
      storagePath: uploadResult.path,
      eventId,
    });

    // Use the URL from uploadResult directly (it's already correctly formatted)
    // Only call getUrl if we need to regenerate it (e.g., for existing images)
    const imageUrl = uploadResult.url;

    return {
      type: imageType,
      url: imageUrl,
      externalUrl,
    };
  }

  private async checkExistingImage(
    storagePath: string,
  ): Promise<string | null> {
    try {
      const exists = await this.storageProvider.exists(storagePath);
      if (exists) {
        return await this.storageProvider.getUrl(storagePath);
      }
    } catch (error) {
      logger.warn('Error checking existing image', {error, storagePath});
    }
    return null;
  }

  private async downloadImage(
    externalUrl: string,
  ): Promise<ImageDownloadResult> {
    try {
      const response = await fetch(externalUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return {
        buffer,
        mimeType: contentType,
        originalUrl: externalUrl,
      };
    } catch (error) {
      logger.error('Error downloading image', {error, externalUrl});
      throw new Error(
        `Failed to download image from ${externalUrl}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private generateImageHash(externalUrl: string): string {
    const hash = crypto.createHash('sha256').update(externalUrl).digest('hex');
    return hash.substring(0, 16);
  }

  private async compressImage(buffer: Buffer): Promise<Buffer> {
    try {
      const compressed = await sharp(buffer)
        .webp({
          quality: 75,
          effort: 4,
        })
        .toBuffer();

      return compressed;
    } catch (error) {
      logger.error('Error compressing image', {error});
      throw new Error(
        `Failed to compress image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
