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
 * Scraper configuration that can be overridden via environment variables.
 * This allows running more aggressive scraping locally while keeping
 * conservative defaults for deployed cronjobs to avoid bot detection.
 *
 * Environment variables:
 * - SCRAPER_MAX_CONCURRENCY: Max parallel browser pages (default: 2)
 * - SCRAPER_SAME_DOMAIN_DELAY_SECS: Delay between requests to same domain (default: 5)
 * - SCRAPER_MAX_REQUESTS_PER_CRAWL: Max URLs to process per crawl (default: 50)
 * - SCRAPER_MAX_PAGES_PER_BROWSER: Max pages per browser instance (default: 2)
 * - SCRAPER_REQUEST_HANDLER_TIMEOUT_SECS: Timeout for processing each request (default: 90)
 * - SCRAPER_NAVIGATION_TIMEOUT_SECS: Timeout for page navigation (default: 45)
 */
function getScraperConfig() {
  const config = {
    maxConcurrency: parseInt(process.env.SCRAPER_MAX_CONCURRENCY || '2', 10),
    sameDomainDelaySecs: parseInt(
      process.env.SCRAPER_SAME_DOMAIN_DELAY_SECS || '5',
      10,
    ),
    maxRequestsPerCrawl: parseInt(
      process.env.SCRAPER_MAX_REQUESTS_PER_CRAWL || '50',
      10,
    ),
    maxPagesPerBrowser: parseInt(
      process.env.SCRAPER_MAX_PAGES_PER_BROWSER || '2',
      10,
    ),
    requestHandlerTimeoutSecs: parseInt(
      process.env.SCRAPER_REQUEST_HANDLER_TIMEOUT_SECS || '90',
      10,
    ),
    navigationTimeoutSecs: parseInt(
      process.env.SCRAPER_NAVIGATION_TIMEOUT_SECS || '45',
      10,
    ),
  };

  logger.info('Scraper configuration loaded', config);
  return config;
}

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
  protected scraperConfig: ReturnType<typeof getScraperConfig>;

  constructor(platform: Platform) {
    this.platform = platform;
    this.config = PLATFORM_CONFIGS[platform];
    this.scraperConfig = getScraperConfig();
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
            // Anti-detection: disable automation flags
            '--disable-blink-features=AutomationControlled',
          ],
        },
      },
      maxRequestRetries: 3, // More retries for flaky connections
      requestHandlerTimeoutSecs: this.scraperConfig.requestHandlerTimeoutSecs,
      navigationTimeoutSecs: this.scraperConfig.navigationTimeoutSecs,
      maxRequestsPerCrawl: this.scraperConfig.maxRequestsPerCrawl,
      // Concurrency settings - configurable via env vars
      // Lower values avoid rate limiting from AWS IPs
      // Higher values speed up local development
      maxConcurrency: this.scraperConfig.maxConcurrency,
      // Delay between requests to same domain (anti-bot measure)
      sameDomainDelaySecs: this.scraperConfig.sameDomainDelaySecs,
      browserPoolOptions: {
        useFingerprints: true, // Enable fingerprint randomization
        maxOpenPagesPerBrowser: this.scraperConfig.maxPagesPerBrowser,
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

    // Configure unique storage directory per platform to avoid conflicts
    // when multiple scrapers run in parallel
    const config = new Configuration({
      storageClientOptions: {
        localDataDirectory: `./storage/${this.platform}`,
      },
    });

    const crawler = new PlaywrightCrawler(mergedOptions, config);

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
