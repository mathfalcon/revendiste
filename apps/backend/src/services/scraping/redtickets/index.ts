import {PlaywrightRequestHandler} from 'crawlee';
import {BaseScraper} from '../base';
import {
  Platform,
  ScrapedEventData,
  ScrapedEventDataSchema,
  ScrapedImageType,
  ScrapedTicketWave,
  ScraperResult,
} from '../base/types';
import {getStringFromError, trimTextAndDefaultToEmpty, logger} from '~/utils';
import {Page} from 'playwright';
import {addHours, addDays, format} from 'date-fns';

enum RequestLabel {
  LIST = 'LIST',
  DETAIL = 'DETAIL',
}

// RedTickets category URL for "Fiestas" (parties)
const FIESTAS_CATEGORY_BASE_URL = 'https://redtickets.uy/categoria/9/Fiestas';

// Number of event instances to create for multi-day events
const MULTI_DAY_OCCURRENCES = 2;

// Default event duration in hours (when no end time is provided)
const DEFAULT_EVENT_DURATION_HOURS = 7;

// Hours at or below this threshold are considered "next day" for nightlife events
// e.g., "Sábado 4 de Abril - 00 hs" means the night of Saturday → starts Sunday at 00:00
const EARLY_MORNING_HOUR_THRESHOLD = 5;

// Spanish month names to numbers
const SPANISH_MONTH_MAP: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

export class RedTicketsScraper extends BaseScraper {
  private events: ScrapedEventData[] = [];
  private baseUrl = 'https://redtickets.uy';

  constructor() {
    super(Platform.RedTickets);
  }

  // Realistic User-Agents to rotate (modern browsers, updated 2025)
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async scrapeEvents(): Promise<ScraperResult> {
    const startTime = Date.now();
    const userAgent = this.getRandomUserAgent();
    logger.debug('RedTickets scraper using User-Agent:', {userAgent});

    const crawler = this.createCrawler({
      launchContext: {
        userAgent,
      },
      // Pre-navigation hook: set up page to look more human
      preNavigationHooks: [
        async ({page}) => {
          // Randomize viewport size (common desktop resolutions)
          const viewports = [
            {width: 1920, height: 1080},
            {width: 1366, height: 768},
            {width: 1536, height: 864},
            {width: 1440, height: 900},
            {width: 1280, height: 720},
          ];
          const viewport =
            viewports[Math.floor(Math.random() * viewports.length)];
          await page.setViewportSize(viewport);

          // Override navigator.webdriver to false (anti-detection)
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
            });
          });
        },
      ],
      requestHandler: this.handleRequest,
      failedRequestHandler: ({request, log, error}) => {
        this.urlsFailed++;
        log.info(`Request ${request.url} failed too many times.`);
        const err = error as Error | undefined;
        log.error(`Failed request details:`, {
          url: request.url,
          errorMessage: err?.message,
          errorName: err?.name,
          retryCount: request.retryCount,
        });
      },
    });

    // Hard timeout to prevent runaway tasks (5 minutes max)
    const CRAWLER_TIMEOUT_MS = 5 * 60 * 1000;

    try {
      // Start with page 0 (first page)
      await crawler.addRequests([
        {
          url: `${FIESTAS_CATEGORY_BASE_URL}/0`,
          userData: {
            label: RequestLabel.LIST,
            page: 0,
          },
        },
      ]);

      this.logMemory('before crawler.run()');

      // Race between crawler and timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Crawler timeout: exceeded ${CRAWLER_TIMEOUT_MS / 1000}s limit`,
            ),
          );
        }, CRAWLER_TIMEOUT_MS);
      });

      await Promise.race([crawler.run(), timeoutPromise]);

      this.logMemory('after crawler.run()');

      const durationMs = Date.now() - startTime;
      logger.info(`Scraped ${this.events.length} events from RedTickets`);
      return this.buildResult(this.events, 'complete', durationMs);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      // If timeout or other error, still return whatever events we managed to scrape
      if (this.events.length > 0) {
        logger.warn(
          `Crawler error but returning ${this.events.length} partial results:`,
          error,
        );
        return this.buildResult(this.events, 'partial', durationMs, 'timeout');
      }
      logger.error('Error scraping RedTickets events:', error);
      return this.buildResult([], 'failed', durationMs, error instanceof Error ? error.message : 'unknown');
    }
  }

  /**
   * Debug a specific URL using the exact same logic as the main scraper.
   * This allows testing extraction logic on a single event without crawling the list.
   *
   * @param url - The detail page URL to scrape
   * @returns The scraped event data, or null if scraping failed
   */
  async debugScrapeUrl(url: string): Promise<ScrapedEventData | null> {
    // Reset events array for this debug run
    this.events = [];

    const userAgent = this.getRandomUserAgent();
    logger.info('Debug scraping URL:', {url, userAgent});

    const crawler = this.createCrawler({
      launchContext: {
        userAgent,
      },
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
      preNavigationHooks: [
        async ({page}) => {
          const viewports = [
            {width: 1920, height: 1080},
            {width: 1366, height: 768},
          ];
          const viewport =
            viewports[Math.floor(Math.random() * viewports.length)];
          await page.setViewportSize(viewport);

          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
            });
          });
        },
      ],
      requestHandler: this.handleRequest,
      failedRequestHandler({request, log, error}) {
        const err = error as Error | undefined;
        log.error(`Debug scrape failed:`, {
          url: request.url,
          errorMessage: err?.message,
        });
      },
    });

    try {
      // Add the URL directly as a DETAIL request (skip list crawling)
      await crawler.addRequests([
        {
          url,
          userData: {
            label: RequestLabel.DETAIL,
          },
        },
      ]);

      await crawler.run();

      if (this.events.length > 0) {
        logger.info('Debug scrape successful', {
          eventName: this.events[0].name,
          hasCoordinates: !!(
            this.events[0].scrapedVenueLatitude &&
            this.events[0].scrapedVenueLongitude
          ),
        });
        return this.events[0];
      }

      logger.warn('Debug scrape completed but no event data was extracted');
      return null;
    } catch (error) {
      logger.error('Debug scrape error:', error);
      return this.events[0] || null;
    }
  }

  handleRequest: PlaywrightRequestHandler = async args => {
    const {request, log} = args;
    log.info(`▶️  ${request.userData.label}  ${request.url}`);

    // Log memory before processing each request
    this.logMemory(`before ${request.userData.label} ${request.url}`);

    switch (request.userData.label) {
      case RequestLabel.LIST:
        await this.handleListRequest(args);
        break;
      case RequestLabel.DETAIL:
        await this.handleDetailRequest(args);
        break;
      default:
        break;
    }

    // Log memory after processing
    this.logMemory(`after ${request.userData.label} ${request.url}`);
  };

  /**
   * Extract total number of pages from pagination component
   * The mobile pagination shows "Página X de Y" format
   */
  private async extractTotalPages(page: Page): Promise<number> {
    try {
      // Look for the mobile pagination text: "Página 1 de 2"
      const paginationText = await page.textContent('.wPageSelectorActual');
      if (paginationText) {
        const match = paginationText.match(/Página\s+\d+\s+de\s+(\d+)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }

      // Fallback: count the page number links in desktop pagination
      const pageLinks = await page.$$('.wPageSelector a');
      if (pageLinks.length > 0) {
        // The last numbered link (before the > arrow) indicates total pages
        // Get all visible page numbers
        const pageNumbers = await page.$$eval(
          '.wPageSelector:not(:last-child) a',
          links =>
            links
              .map(link => parseInt(link.textContent || '0', 10))
              .filter(n => !isNaN(n)),
        );
        if (pageNumbers.length > 0) {
          return Math.max(...pageNumbers) + 1; // +1 because pages are 0-indexed in URL
        }
      }

      return 1; // Default to 1 page if we can't determine
    } catch (error) {
      logger.warn('Could not determine total pages, defaulting to 1:', error);
      return 1;
    }
  }

  private handleListRequest: PlaywrightRequestHandler = async args => {
    const {page, request, enqueueLinks, crawler, log} = args;
    const currentPage = request.userData.page as number;

    // On first page, determine total pages and queue all other pages
    if (currentPage === 0) {
      const totalPages = await this.extractTotalPages(page);
      log.info(`Found ${totalPages} total pages in Fiestas category`);

      // Queue remaining pages (starting from page 1)
      if (totalPages > 1) {
        const additionalPageRequests = [];
        for (let pageNum = 1; pageNum < totalPages; pageNum++) {
          additionalPageRequests.push({
            url: `${FIESTAS_CATEGORY_BASE_URL}/${pageNum}`,
            userData: {
              label: RequestLabel.LIST,
              page: pageNum,
            },
          });
        }
        await crawler.addRequests(additionalPageRequests);
        log.info(`Queued ${additionalPageRequests.length} additional pages`);
      }
    }

    // Enqueue all event detail pages from this list page
    // Events are in <article class="card"> with links in <a href="/evento/...">
    await enqueueLinks({
      selector: 'article.card a[href^="/evento/"]',
      transformRequestFunction: req => {
        // Extract event ID from URL: /evento/{slug}/{id}/
        const urlMatch = req.url.match(/\/evento\/[^/]+\/(\d+)\/?$/);
        const eventId = urlMatch ? urlMatch[1] : '';

        req.userData = {
          label: RequestLabel.DETAIL,
          eventId,
        };
        return req;
      },
    });

    log.info(`Queued event detail pages from list page ${currentPage}`);
  };

  private handleDetailRequest: PlaywrightRequestHandler = async args => {
    const {page, request, log} = args;
    const url = page.url();
    const eventId = request.userData.eventId as string;

    try {
      // Wait for the page to load - RedTickets uses JavaScript rendering
      await page.waitForSelector('#W0010TXTTITLE, .Title', {timeout: 10000});

      const eventDataList = await this.extractEventDetails(page, url, eventId);

      // Add all extracted events (could be multiple for multi-day events)
      for (const eventData of eventDataList) {
        this.validateAndAddEvent(eventData);
      }
      this.urlsProcessed++;
    } catch (error) {
      log.error(
        `Error extracting event details for ${url}: ${getStringFromError(error)}`,
      );
      // Don't throw - continue with other events
    }
  };

  /**
   * Extract event details from the detail page
   * Returns an array of events (multiple for multi-day events)
   */
  private async extractEventDetails(
    page: Page,
    url: string,
    eventId: string,
  ): Promise<Partial<ScrapedEventData>[]> {
    try {
      // Extract event name from #W0010TXTTITLE
      const name = trimTextAndDefaultToEmpty(
        await page.textContent('#W0010TXTTITLE'),
      );

      if (!name) {
        logger.warn(`Could not extract event name from ${url}`);
        return [];
      }

      // Extract event image (Hero only) from img.EventImage
      const heroImgSrc = await page.getAttribute('img.EventImage', 'src');

      // Extract venue address from #W0010TXTADDRESS
      const venueAddress = trimTextAndDefaultToEmpty(
        await page.textContent('#W0010TXTADDRESS'),
      );

      // Extract description from .TableEventInfo .RowPadding p
      const descriptionParts: string[] = [];

      // Get main description from paragraph
      const mainDescription = await page.$eval(
        '.TableEventInfo .RowPadding p',
        el => el.innerHTML,
      ).catch(() => '');

      if (mainDescription) {
        descriptionParts.push(this.convertHtmlToFormattedText(mainDescription));
      }

      // Get minimum age if available
      const minAge = trimTextAndDefaultToEmpty(
        await page.textContent('#span_W0010vMINAGE'),
      );
      if (minAge) {
        descriptionParts.push(minAge);
      }

      const description = descriptionParts.join('\n').trim();

      // Extract coordinates from Google Maps iframe
      const coordinates = await this.extractCoordinates(page);

      // Extract ticket waves
      const ticketWaves = await this.scrapeTicketWaves(page);

      // Extract date text from #W0010TXTDATELONG
      const dateText = trimTextAndDefaultToEmpty(
        await page.textContent('#W0010TXTDATELONG'),
      );

      // Extract time from #comboTime or radio buttons
      const eventTime = await this.extractEventTime(page);

      // Check if this is a multi-day event ("Todos los días de...")
      const isMultiDay = dateText.toLowerCase().includes('todos los días');

      // Parse dates based on single-day or multi-day
      const eventDates = isMultiDay
        ? this.generateMultiDayDates(dateText, eventTime)
        : this.parseSingleDayDate(dateText, eventTime);

      if (eventDates.length === 0) {
        logger.warn(`Could not parse date from ${url}: "${dateText}"`);
        return [];
      }

      // Build base event data (shared across all occurrences)
      const baseEventData = {
        platform: Platform.RedTickets,
        name,
        description: description || undefined,
        scrapedVenueName: this.extractVenueName(venueAddress),
        scrapedVenueAddress: venueAddress || '',
        scrapedVenueLatitude: coordinates?.latitude,
        scrapedVenueLongitude: coordinates?.longitude,
        externalUrl: url,
        images: heroImgSrc
          ? [
              {
                type: ScrapedImageType.Hero,
                url: heroImgSrc,
              },
            ]
          : [],
        ticketWaves,
        // RedTickets has no QR timing restriction
      };

      // Create event(s) for each date
      return eventDates.map(({startDate, endDate, dateSuffix}) => ({
        ...baseEventData,
        externalId: dateSuffix ? `${eventId}-${dateSuffix}` : eventId,
        eventStartDate: startDate,
        eventEndDate: endDate,
      }));
    } catch (error) {
      logger.error(`Error extracting event details from ${url}:`, error);
      return [];
    }
  }

  /**
   * Extract venue name from address (first part before " - ")
   */
  private extractVenueName(venueAddress: string): string | undefined {
    if (!venueAddress) return undefined;
    const parts = venueAddress.split(' - ');
    return parts[0]?.trim() || undefined;
  }

  /**
   * Extract event time from combo box or radio buttons
   * Returns time string like "23:59" or null
   */
  private async extractEventTime(page: Page): Promise<string | null> {
    try {
      // Try combo box first
      const comboTime = await page.$eval(
        '#comboTime option:not([value="0"])',
        el => el.textContent?.trim() || null,
      ).catch(() => null);

      if (comboTime) return comboTime;

      // Try radio buttons
      const radioTime = await page.$eval(
        '#radioButtonTime .id-radio-tile-label',
        el => el.textContent?.trim() || null,
      ).catch(() => null);

      return radioTime;
    } catch {
      return null;
    }
  }

  /**
   * Extract coordinates from Google Maps iframe src
   */
  private async extractCoordinates(
    page: Page,
  ): Promise<{latitude: number; longitude: number} | null> {
    try {
      const iframeSrc = await page.getAttribute(
        'iframe[src*="maps.google.com"], iframe[src*="google.com/maps"]',
        'src',
      );

      if (!iframeSrc) return null;

      // Parse q parameter: q=-34.96535100 , -54.94998100
      const match = iframeSrc.match(/q=(-?[\d.]+)\s*,\s*(-?[\d.]+)/);
      if (match) {
        return {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse single-day event date
   * Format: "Jueves 22 de Enero - 21:30 hs" or "Jueves 22 de Enero"
   */
  private parseSingleDayDate(
    dateText: string,
    eventTime: string | null,
  ): Array<{startDate: Date; endDate: Date; dateSuffix: string | null}> {
    // Pattern: "DayOfWeek DD de Month" with optional " - HH:MM hs" or " - HH hs"
    const match = dateText.match(
      /([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)(?:\s*-\s*(\d+)(?::(\d+))?\s*(?:hs)?)?/i,
    );

    if (!match) return [];

    const [, , day, month, hourFromDate, minuteFromDate] = match;
    const monthNum = SPANISH_MONTH_MAP[month.toLowerCase()];

    if (monthNum === undefined) return [];

    // Determine time: from date string, or from time selector, or default
    let hour = 23;
    let minute = 0;

    if (hourFromDate) {
      hour = parseInt(hourFromDate, 10);
      minute = minuteFromDate ? parseInt(minuteFromDate, 10) : 0;
    } else if (eventTime) {
      const timeMatch = eventTime.match(/(\d+):(\d+)/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        minute = parseInt(timeMatch[2], 10);
      }
    }

    const dayNum = parseInt(day, 10);

    const now = new Date();
    let year = now.getFullYear();

    // If the date has already passed, assume next year.
    // Compare by date only (ignoring time) to avoid bumping same-day events
    // to next year just because e.g. midnight already passed today.
    const tentativeDate = new Date(year, monthNum, dayNum);
    const todayStart = new Date(year, now.getMonth(), now.getDate());
    if (tentativeDate < todayStart) {
      year++;
    }

    // For nightlife events: early morning hours (0-5) mean the party is on
    // the listed date's night. Store as 23:59 of that date so "today" filters
    // work correctly. e.g., "Sábado 4 de Abril - 00 hs" → April 4 23:59
    if (hour <= EARLY_MORNING_HOUR_THRESHOLD) {
      hour = 23;
      minute = 59;
    }

    const startDate = new Date(year, monthNum, dayNum, hour, minute);

    const endDate = addHours(startDate, DEFAULT_EVENT_DURATION_HOURS);

    return [{startDate, endDate, dateSuffix: null}];
  }

  /**
   * Generate multiple dates for multi-day events
   * Creates events for the next MULTI_DAY_OCCURRENCES days
   */
  private generateMultiDayDates(
    dateText: string,
    eventTime: string | null,
  ): Array<{startDate: Date; endDate: Date; dateSuffix: string}> {
    // Extract month from "Todos los días de Enero"
    const monthMatch = dateText.match(
      /todos\s+los\s+días\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)/i,
    );

    if (!monthMatch) {
      logger.warn(`Could not parse multi-day month from: "${dateText}"`);
      return [];
    }

    const month = monthMatch[1];
    const monthNum = SPANISH_MONTH_MAP[month.toLowerCase()];

    if (monthNum === undefined) {
      logger.warn(`Unknown month: "${month}"`);
      return [];
    }

    // Parse time
    let hour = 23;
    let minute = 59;

    if (eventTime) {
      const timeMatch = eventTime.match(/(\d+):(\d+)/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        minute = parseInt(timeMatch[2], 10);
      }
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Determine the year for this month
    let year = currentYear;
    // If we're in December and the event is in January, it's next year
    if (now.getMonth() > monthNum) {
      year++;
    }

    const results: Array<{startDate: Date; endDate: Date; dateSuffix: string}> =
      [];

    // Generate events for the next MULTI_DAY_OCCURRENCES days
    for (let i = 0; i < MULTI_DAY_OCCURRENCES; i++) {
      const eventDate = addDays(now, i);

      // Only include dates within the specified month
      if (eventDate.getMonth() !== monthNum) {
        // If we've moved past the month, stop
        if (eventDate.getMonth() > monthNum && eventDate.getFullYear() === year) {
          break;
        }
        // If we're before the month (shouldn't happen), skip
        continue;
      }

      const startDate = new Date(
        year,
        monthNum,
        eventDate.getDate(),
        hour,
        minute,
      );
      const endDate = addHours(startDate, DEFAULT_EVENT_DURATION_HOURS);
      const dateSuffix = format(startDate, 'yyyy-MM-dd');

      results.push({startDate, endDate, dateSuffix});
    }

    return results;
  }

  /**
   * Extract ticket waves from the detail page
   * Tries combo box first (#comboTicket), then radio buttons (.id-input-container)
   */
  private async scrapeTicketWaves(page: Page): Promise<ScrapedTicketWave[]> {
    try {
      // Try combo box first: options like "General Lote 1 ($ 1190)"
      const comboWaves = await this.extractTicketWavesFromCombo(page);
      if (comboWaves.length > 0) {
        return comboWaves;
      }

      // Fall back to radio buttons
      return await this.extractTicketWavesFromRadio(page);
    } catch (error) {
      logger.debug('Could not extract ticket waves:', error);
      return [];
    }
  }

  /**
   * Extract ticket waves from combo box (#comboTicket)
   * Format: "Name ($ Price)" or "Name ($ Price) X disponibles"
   */
  private async extractTicketWavesFromCombo(
    page: Page,
  ): Promise<ScrapedTicketWave[]> {
    try {
      const waves = await page.$$eval('#comboTicket option', options => {
        const result: Array<{
          externalId: string;
          name: string;
          faceValue: number;
          isSoldOut: boolean;
        }> = [];

        options.forEach(option => {
          const value = option.getAttribute('value');
          const text = option.textContent?.trim() || '';

          // Skip placeholder options (value "0" or empty text)
          if (value === '0' || !text || text.toLowerCase().includes('elige')) {
            return;
          }

          // Parse "Name ($ Price)" or "Name ($ Price) X disponibles"
          const match = text.match(/^(.+?)\s*\(\$\s*([\d.,]+)\)(.*)$/);
          if (match) {
            const [, name, priceStr, extra] = match;
            const price = parseFloat(priceStr.replace(',', '.')) || 0;
            const isSoldOut =
              extra.toLowerCase().includes('agotad') ||
              extra.includes('0 disponibles');

            result.push({
              externalId: value || `ticket-${result.length}`,
              name: name.trim(),
              faceValue: price,
              isSoldOut,
            });
          }
        });

        return result;
      });

      return waves.map(w => ({
        ...w,
        currency: 'UYU' as const,
        isAvailable: !w.isSoldOut,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Extract ticket waves from radio buttons (.id-input-container)
   * Structure: input[name="Ticket"] + .id-radio-tile with labels
   */
  private async extractTicketWavesFromRadio(
    page: Page,
  ): Promise<ScrapedTicketWave[]> {
    try {
      const waves = await page.$$eval(
        '#radioButtonTicket .id-input-container',
        containers => {
          const result: Array<{
            externalId: string;
            name: string;
            faceValue: number;
            isSoldOut: boolean;
          }> = [];

          containers.forEach(container => {
            const input = container.querySelector(
              'input[name="Ticket"]',
            ) as HTMLInputElement;
            const value = input?.value;

            // Skip placeholder (value "0")
            if (value === '0') return;

            const labels = container.querySelectorAll('.id-radio-tile-label');
            const nameLabel = labels[0]?.textContent?.trim() || '';
            const priceLabel = labels[1]?.textContent?.trim() || '';
            const availabilityLabel = labels[2]?.textContent?.trim() || '';

            // Skip if it's a placeholder text
            if (nameLabel.toLowerCase().includes('elige')) return;

            // Parse price from "$ 1190"
            const priceMatch = priceLabel.match(/\$?\s*([\d.,]+)/);
            const price = priceMatch
              ? parseFloat(priceMatch[1].replace(',', '.'))
              : 0;

            const isSoldOut =
              availabilityLabel.toLowerCase().includes('agotad') ||
              availabilityLabel.includes('0 disponibles');

            result.push({
              externalId: value || `ticket-${result.length}`,
              name: nameLabel,
              faceValue: price,
              isSoldOut,
            });
          });

          return result;
        },
      );

      return waves.map(w => ({
        ...w,
        currency: 'UYU' as const,
        isAvailable: !w.isSoldOut,
      }));
    } catch {
      return [];
    }
  }

  private validateAndAddEvent(eventData: Partial<ScrapedEventData>) {
    const validationResult = ScrapedEventDataSchema.safeParse(eventData);

    if (!validationResult.success) {
      logger.error('Invalid event data:', validationResult.error);
      logger.debug('Event data that failed validation:', eventData);
      return;
    }

    this.events.push(validationResult.data);
  }
}
