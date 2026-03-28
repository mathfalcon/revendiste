import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import {getStorageProvider} from '../storage';
import {logger} from '~/utils';
import {ScrapedImageType} from './base/types';

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

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_WATERMARK_WIDTH = 180;
const OG_BAR_HEIGHT = 96;
const OG_BAR_ALPHA = 0.9;
const OG_BLUR_SIGMA = 30;

export class EventImageService {
  private readonly storageProvider = getStorageProvider();
  private watermarkBuffer: Buffer | null = null;

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
        processedImages.push(...processed);
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
  ): Promise<ProcessedImage[]> {
    const imageHash = this.generateImageHash(externalUrl);
    const directory = `public/assets/events/${eventId}`;
    const filename = `${imageType}-${imageHash}`;
    const storagePath = `${directory}/${filename}.webp`;

    const results: ProcessedImage[] = [];

    // Check if original image already exists
    const existingImage = await this.checkExistingImage(storagePath);
    if (existingImage) {
      logger.debug('Image already exists in storage, skipping upload', {
        storagePath,
        externalUrl,
        eventId,
      });
      results.push({
        type: imageType,
        url: existingImage,
        externalUrl,
      });

      // Still check if OG version needs to be generated for hero images
      if (imageType === ScrapedImageType.Hero) {
        const ogResult = await this.ensureOgImage(
          existingImage,
          imageHash,
          directory,
          eventId,
          externalUrl,
        );
        if (ogResult) results.push(ogResult);
      }

      return results;
    }

    const {buffer: originalBuffer} = await this.downloadImage(externalUrl);
    const compressedBuffer = await this.compressImage(originalBuffer);

    const compressionRatio = (
      (1 - compressedBuffer.length / originalBuffer.length) *
      100
    ).toFixed(1);
    logger.debug('Compressed event image', {
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

    logger.debug('Uploaded event image to storage', {
      storagePath: uploadResult.path,
      eventId,
    });

    const imageUrl = uploadResult.url;

    results.push({
      type: imageType,
      url: imageUrl,
      externalUrl,
    });

    // Generate OG version for hero images
    if (imageType === ScrapedImageType.Hero) {
      try {
        const ogImage = await this.generateAndUploadOgImage(
          originalBuffer,
          imageHash,
          directory,
          eventId,
          externalUrl,
        );
        if (ogImage) results.push(ogImage);
      } catch (error) {
        logger.error('Failed to generate OG image, continuing without it', {
          error,
          eventId,
        });
      }
    }

    return results;
  }

  /**
   * Ensures an OG version exists for an already-stored hero image.
   * Downloads the existing image from storage if needed.
   */
  private async ensureOgImage(
    existingImageUrl: string,
    imageHash: string,
    directory: string,
    eventId: string,
    externalUrl: string,
  ): Promise<ProcessedImage | null> {
    const ogFilename = `og_hero-${imageHash}`;
    const ogStoragePath = `${directory}/${ogFilename}.jpg`;

    const existingOg = await this.checkExistingImage(ogStoragePath);
    if (existingOg) {
      return {
        type: ScrapedImageType.OgHero,
        url: existingOg,
        externalUrl,
      };
    }

    // OG version doesn't exist — download the original to generate it
    try {
      const {buffer} = await this.downloadImage(existingImageUrl);
      return await this.generateAndUploadOgImage(
        buffer,
        imageHash,
        directory,
        eventId,
        externalUrl,
      );
    } catch (error) {
      logger.error('Failed to generate OG image from existing hero', {
        error,
        eventId,
      });
      return null;
    }
  }

  private async generateAndUploadOgImage(
    sourceBuffer: Buffer,
    imageHash: string,
    directory: string,
    eventId: string,
    externalUrl: string,
  ): Promise<ProcessedImage | null> {
    const ogFilename = `og_hero-${imageHash}`;
    const ogStoragePath = `${directory}/${ogFilename}.jpg`;

    // Check if OG version already exists
    const existingOg = await this.checkExistingImage(ogStoragePath);
    if (existingOg) {
      return {
        type: ScrapedImageType.OgHero,
        url: existingOg,
        externalUrl,
      };
    }

    const ogBuffer = await this.createOgImage(sourceBuffer);

    const ogUploadResult = await this.storageProvider.upload(ogBuffer, {
      originalName: 'og_hero.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: ogBuffer.length,
      directory,
      filename: ogFilename,
    });

    logger.debug('Uploaded OG image to storage', {
      storagePath: ogUploadResult.path,
      eventId,
    });

    return {
      type: ScrapedImageType.OgHero,
      url: ogUploadResult.url,
      externalUrl,
    };
  }

  private async createOgImage(sourceBuffer: Buffer): Promise<Buffer> {
    // Step 1: Create blurred background that fills the full OG canvas
    const blurredBg = await sharp(sourceBuffer)
      .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
        fit: 'cover',
        position: 'centre',
      })
      .blur(OG_BLUR_SIGMA)
      // Darken the blurred bg slightly so the foreground pops
      .modulate({brightness: 0.6})
      .toBuffer();

    // Step 2: Resize source image to fit within the canvas (contain, no crop)
    const fittedImage = await sharp(sourceBuffer)
      .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: false,
      })
      .toBuffer();

    const fittedMeta = await sharp(fittedImage).metadata();
    const fittedWidth = fittedMeta.width || OG_IMAGE_WIDTH;
    const fittedHeight = fittedMeta.height || OG_IMAGE_HEIGHT;

    // Center the fitted image on the canvas
    const leftOffset = Math.round((OG_IMAGE_WIDTH - fittedWidth) / 2);
    const topOffset = Math.round((OG_IMAGE_HEIGHT - fittedHeight) / 2);

    // Step 3: Extract dominant color from source image for the bar
    const {dominant} = await sharp(sourceBuffer).stats();
    // Darken the dominant color so logo text is readable
    const barR = Math.round(dominant.r * 0.4);
    const barG = Math.round(dominant.g * 0.4);
    const barB = Math.round(dominant.b * 0.4);

    const barSvg = Buffer.from(
      `<svg width="${OG_IMAGE_WIDTH}" height="${OG_BAR_HEIGHT}">
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="0" />
            <stop offset="30%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="0.4" />
            <stop offset="50%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="${OG_BAR_ALPHA}" />
            <stop offset="100%" stop-color="rgb(${barR},${barG},${barB})" stop-opacity="1" />
          </linearGradient>
        </defs>
        <rect width="${OG_IMAGE_WIDTH}" height="${OG_BAR_HEIGHT}" fill="url(#fade)" />
      </svg>`,
    );

    // Step 4: Resize watermark logo — pick light/dark variant based on bar brightness
    const barLuminance = 0.299 * barR + 0.587 * barG + 0.114 * barB;
    const watermark = this.getWatermarkSvg(barLuminance > 120);
    const resizedWatermark = await sharp(watermark)
      .resize(OG_WATERMARK_WIDTH, OG_BAR_HEIGHT - 16, {fit: 'inside'})
      .toBuffer();

    const wmMeta = await sharp(resizedWatermark).metadata();
    const wmWidth = wmMeta.width || OG_WATERMARK_WIDTH;
    const wmHeight = wmMeta.height || OG_BAR_HEIGHT - 16;

    // Center watermark horizontally, anchor to bottom of image with fixed padding
    const wmLeft = Math.round((OG_IMAGE_WIDTH - wmWidth) / 2);
    const wmBottomPadding = 12;
    const wmTop = OG_IMAGE_HEIGHT - wmHeight - wmBottomPadding;

    // Step 5: Compose everything together
    const result = await sharp(blurredBg)
      .composite([
        // Fitted source image centered on blurred bg
        {
          input: fittedImage,
          left: leftOffset,
          top: topOffset,
        },
        // Solid bar at the bottom
        {
          input: barSvg,
          left: 0,
          top: OG_IMAGE_HEIGHT - OG_BAR_HEIGHT,
        },
        // Watermark centered in the bar
        {
          input: resizedWatermark,
          left: wmLeft,
          top: wmTop,
        },
      ])
      .jpeg({quality: 85})
      .toBuffer();

    return result;
  }

  /**
   * Returns the watermark SVG buffer with the correct text color.
   * @param dark - If true, renders black text (for bright backgrounds). Otherwise white.
   */
  private getWatermarkSvg(dark: boolean): Buffer {
    if (!this.watermarkBuffer) {
      const watermarkPath = path.resolve(
        __dirname,
        '../../assets/og-watermark.svg',
      );
      this.watermarkBuffer = fs.readFileSync(watermarkPath);
    }

    if (!dark) return this.watermarkBuffer;

    // Swap white (#ffffff) text to black (#000000) for bright backgrounds
    const svg = this.watermarkBuffer.toString('utf-8');
    return Buffer.from(svg.replace(/#ffffff/gi, '#000000'));
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
