import {
  Configuration,
  PlaywrightCrawler,
  PlaywrightCrawlerOptions,
} from 'crawlee';
import {
  Platform,
  PlatformConfig,
  ScrapedEventData,
} from './types';
import {PLATFORM_CONFIGS} from './config';
import {logger} from '~/utils';

/**
 * Log memory usage for debugging container resource issues
 * Only logs in debug level (dev environment)
 */
function logMemoryUsage(context: string): void {
  const memUsage = process.memoryUsage();
  const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  logger.debug(`Memory usage [${context}]`, {
    heapUsed: `${formatMB(memUsage.heapUsed)} MB`,
    heapTotal: `${formatMB(memUsage.heapTotal)} MB`,
    rss: `${formatMB(memUsage.rss)} MB`,
    external: `${formatMB(memUsage.external)} MB`,
  });
}

export abstract class BaseScraper {
  protected platform: Platform;
  protected config: PlatformConfig;

  constructor(platform: Platform) {
    this.platform = platform;
    this.config = PLATFORM_CONFIGS[platform];
  }

  protected getCrawlerOptions(): PlaywrightCrawlerOptions {
    // Use system Chromium if PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set (e.g., in Docker)
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

    return {
      launchContext: {
        launchOptions: {
          headless: true,
          executablePath: executablePath || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        },
      },
      maxRequestRetries: 2,
      requestHandlerTimeoutSecs: 60,
      navigationTimeoutSecs: 30,
      maxRequestsPerCrawl: 50, // Can be overridden by subclasses
      // Limit concurrency to balance speed vs memory in containerized environments
      // With 1GB RAM: 5 concurrent requests uses ~300-400MB, leaving headroom
      maxConcurrency: 5,
      browserPoolOptions: {
        useFingerprints: false,
        maxOpenPagesPerBrowser: 3, // Allow more pages per browser instance
      },
    };
  }

  protected createCrawler(
    options?: Partial<PlaywrightCrawlerOptions>,
  ): PlaywrightCrawler {
    logMemoryUsage('before crawler creation');

    const baseOptions = this.getCrawlerOptions();

    // Deep merge launchContext to preserve executablePath and other base options
    const mergedOptions: PlaywrightCrawlerOptions = {
      ...baseOptions,
      ...options,
      launchContext: {
        ...baseOptions.launchContext,
        ...options?.launchContext,
        launchOptions: {
          ...baseOptions.launchContext?.launchOptions,
          ...options?.launchContext?.launchOptions,
        },
      },
    };

    Configuration.set('systemInfoV2', true);

    const crawler = new PlaywrightCrawler(mergedOptions);

    logMemoryUsage('after crawler creation');

    return crawler;
  }

  /**
   * Log memory usage - call this from request handlers to track memory during scraping
   */
  protected logMemory(context: string): void {
    logMemoryUsage(context);
  }

  protected extractPrice(priceText: string): number {
    // Extract numeric price from text like "UYU 1,500" or "$1500"
    const priceMatch = priceText.match(/[\d,]+/);
    if (priceMatch) {
      return parseFloat(priceMatch[0].replace(/,/g, ''));
    }
    return 0;
  }

  protected formatDate(timestamp: string | null): string {
    if (timestamp) {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    return '';
  }

  /**
   * Convert HTML content to formatted text with proper line breaks
   */
  protected convertHtmlToFormattedText(html: string): string {
    return (
      html
        // Replace <br> and <br/> tags with newlines
        .replace(/<br\s*\/?>/gi, '\n')
        // Replace closing tags with newlines (any HTML element)
        .replace(/<\/[^>]+>/g, '\n')
        // Remove all opening HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Clean up multiple consecutive newlines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Trim whitespace from each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Final trim
        .trim()
    );
  }

  abstract scrapeEvents(): Promise<ScrapedEventData[]>;

  getPlatformName(): Platform {
    return this.platform;
  }
}
