import {
  Configuration,
  PlaywrightCrawler,
  PlaywrightCrawlerOptions,
} from 'crawlee';
import {
  Platform,
  PlatformConfig,
  ScrapedEventData,
  ScrapedTicketWave,
} from './types';
import {PLATFORM_CONFIGS} from './config';

export abstract class BaseScraper {
  protected platform: Platform;
  protected config: PlatformConfig;

  constructor(platform: Platform) {
    this.platform = platform;
    this.config = PLATFORM_CONFIGS[platform];
  }

  protected getCrawlerOptions(): PlaywrightCrawlerOptions {
    return {
      launchContext: {
        launchOptions: {
          headless: true,
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
      browserPoolOptions: {
        useFingerprints: false,
      },
    };
  }

  protected createCrawler(
    options?: Partial<PlaywrightCrawlerOptions>,
  ): PlaywrightCrawler {
    const baseOptions = this.getCrawlerOptions();
    const mergedOptions = {...baseOptions, ...options};
    Configuration.set('systemInfoV2', true);

    return new PlaywrightCrawler(mergedOptions);
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

  abstract scrapeEvents(): Promise<ScrapedEventData[]>;
  abstract scrapeTicketWaves(eventId: string): Promise<ScrapedTicketWave[]>;

  getPlatformName(): Platform {
    return this.platform;
  }
}
