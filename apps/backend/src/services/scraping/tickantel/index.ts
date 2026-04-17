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
import {addHours} from 'date-fns';
import {TZDate} from '@date-fns/tz';
import {Page} from 'playwright';

const URUGUAY_TZ = 'America/Montevideo';

enum RequestLabel {
  LIST = 'LIST',
  DETAIL = 'DETAIL',
  FUNCTION_DETAIL = 'FUNCTION_DETAIL',
}

const LIST_URL = 'https://tickantel.com.uy/inicio/buscar_grupo?2&cat_id=17';

// Default event duration in hours (hardcoded for Tickantel — end time is never provided)
const DEFAULT_EVENT_DURATION_HOURS = 4;

// Max attempts to click "Cargar más" before giving up
const MAX_LOAD_MORE_CLICKS = 50;

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

// Short month abbreviations used in the function carousel
const SPANISH_MONTH_ABBR_MAP: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

interface SharedEventData {
  eventId: string;
  name: string;
  description: string | undefined;
  scrapedVenueName: string | undefined;
  scrapedVenueAddress: string;
  scrapedVenueLatitude: number | undefined;
  scrapedVenueLongitude: number | undefined;
  imageUrl: string | undefined;
  externalUrl: string;
}

export class TickantelScraper extends BaseScraper {
  private events: ScrapedEventData[] = [];
  private baseUrl = 'https://tickantel.com.uy';

  constructor() {
    super(Platform.Tickantel);
  }

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
    logger.debug('Tickantel scraper using User-Agent:', {userAgent});

    const crawler = this.createCrawler({
      launchContext: {
        userAgent,
      },
      preNavigationHooks: [
        async ({page}) => {
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

    const CRAWLER_TIMEOUT_MS = 10 * 60 * 1000;

    try {
      await crawler.addRequests([
        {
          url: LIST_URL,
          userData: {label: RequestLabel.LIST},
        },
      ]);

      this.logMemory('before crawler.run()');

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
      logger.info(`Scraped ${this.events.length} events from Tickantel`);
      return this.buildResult(this.events, 'complete', durationMs);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      if (this.events.length > 0) {
        logger.warn(
          `Crawler error but returning ${this.events.length} partial results:`,
          error,
        );
        return this.buildResult(this.events, 'partial', durationMs, 'timeout');
      }
      logger.error('Error scraping Tickantel events:', error);
      return this.buildResult(
        [],
        'failed',
        durationMs,
        error instanceof Error ? error.message : 'unknown',
      );
    }
  }

  /**
   * Debug a specific event detail URL using the same extraction logic.
   * Pass the main event page URL (not a function-specific URL).
   */
  async debugScrapeUrl(url: string): Promise<ScrapedEventData | null> {
    this.events = [];

    const userAgent = this.getRandomUserAgent();
    logger.info('Tickantel debug scraping URL:', {url, userAgent});

    const crawler = this.createCrawler({
      launchContext: {userAgent},
      maxRequestsPerCrawl: 20,
      maxConcurrency: 1,
      preNavigationHooks: [
        async ({page}) => {
          await page.setViewportSize({width: 1366, height: 768});
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {get: () => false});
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
      await crawler.addRequests([
        {
          url,
          userData: {label: RequestLabel.DETAIL},
        },
      ]);

      await crawler.run();

      if (this.events.length > 0) {
        logger.info('Debug scrape successful', {
          totalEvents: this.events.length,
          externalIds: this.events.map(e => e.externalId),
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

  /** Debug: return ALL events produced (one per function). */
  async debugScrapeUrlAll(url: string): Promise<ScrapedEventData[]> {
    await this.debugScrapeUrl(url);
    return this.events;
  }

  handleRequest: PlaywrightRequestHandler = async args => {
    const {request, log} = args;
    log.info(`▶️  ${request.userData.label}  ${request.url}`);
    this.logMemory(`before ${request.userData.label} ${request.url}`);

    switch (request.userData.label) {
      case RequestLabel.LIST:
        await this.handleListRequest(args);
        break;
      case RequestLabel.DETAIL:
        await this.handleDetailRequest(args);
        break;
      case RequestLabel.FUNCTION_DETAIL:
        await this.handleFunctionDetailRequest(args);
        break;
      default:
        break;
    }

    this.logMemory(`after ${request.userData.label} ${request.url}`);
  };

  /**
   * LIST handler: click "Cargar más" until exhausted, then enqueue all event detail URLs.
   */
  private handleListRequest: PlaywrightRequestHandler = async args => {
    const {page, enqueueLinks, log} = args;

    // Wait for the event grid to load
    await page
      .waitForSelector('.col-lg-4 .item', {timeout: 30000})
      .catch(() => {
        log.info('Event grid not found on list page');
      });

    // Click "Cargar más resultados" until it disappears.
    // Tickantel (Wicket) shows a loading overlay during AJAX updates that can
    // detach the button from the DOM. We use try/catch per click so a single
    // stale-element error doesn't bubble up and cause Crawlee to retry the
    // entire LIST request.
    let clicks = 0;
    while (clicks < MAX_LOAD_MORE_CLICKS) {
      const isVisible = await page
        .locator('a.cargar-link')
        .isVisible()
        .catch(() => false);
      if (!isVisible) break;

      log.info(`Clicking "Cargar más" (attempt ${clicks + 1})`);

      try {
        // Wait for any loading overlay to clear before clicking
        await page
          .waitForSelector('.loading', {state: 'hidden', timeout: 5000})
          .catch(() => {});

        await page.locator('a.cargar-link').click({timeout: 5000});

        // Wait for AJAX content to load — either new items appear or the
        // loading overlay finishes
        await page
          .waitForSelector('.loading', {state: 'hidden', timeout: 10000})
          .catch(() => {});
        await page.waitForTimeout(1000);

        clicks++;
      } catch (clickError) {
        // Button was detached or hidden during click (Wicket re-render).
        // This typically means the AJAX load completed and there are no more
        // results, or the button was removed. Break out of the loop.
        log.info(
          `"Cargar más" click failed (likely no more results): ${clickError instanceof Error ? clickError.message.split('\n')[0] : 'unknown'}`,
        );
        break;
      }
    }

    log.info(`Finished loading results after ${clicks} clicks`);

    // Enqueue all event detail pages (espectaculo and alta_demanda cards).
    // alta_demanda pages are scraped directly for event metadata; ticket waves
    // will be empty since they are behind a virtual queue.
    await enqueueLinks({
      selector:
        '.col-lg-4 .item a[href*="espectaculo"], .col-lg-4 .item a[href*="alta_demanda"]',
      transformRequestFunction: req => {
        // Extract eventId from URL path for both espectaculo and alta_demanda
        const urlMatch = req.url.match(
          /\/(?:espectaculo|alta_demanda)\/(\d+)\//,
        );
        const eventId = urlMatch ? urlMatch[1] : '';

        req.userData = {
          label: RequestLabel.DETAIL,
          eventId,
        };
        return req;
      },
    });

    log.info('Enqueued event detail pages from list');
  };

  /**
   * DETAIL handler: extract shared event data and discover all functions.
   * For single-function events, produces one ScrapedEventData directly.
   * For multi-function events, enqueues a FUNCTION_DETAIL request per function.
   */
  private handleDetailRequest: PlaywrightRequestHandler = async args => {
    const {page, request, crawler, log} = args;
    const url = page.url();
    const isAltaDemanda = url.includes('/alta_demanda/');
    let altaDemandaBypassed = false;

    // Extract eventId from URL or userData
    const eventId =
      (request.userData.eventId as string | undefined) ||
      this.extractEventIdFromUrl(url);

    if (!eventId) {
      log.info(`Could not extract eventId from URL: ${url}`);
      return;
    }

    try {
      await page.waitForSelector('.espectaculo__title h1', {timeout: 15000});

      const sharedData = await this.extractSharedEventData(page, url, eventId);
      if (!sharedData) {
        log.info(`Could not extract shared data from ${url}`);
        return;
      }

      // alta_demanda pages are behind a virtual queue. Click "Continuar" to
      // attempt instant access — if the queue is open, the browser navigates
      // to the real espectaculo page. If we end up in a queue or back on
      // alta_demanda, fall back to scraping the limited data from this page.
      if (isAltaDemanda) {
        const bypassed = await this.tryBypassAltaDemanda(page, log);

        if (bypassed) {
          altaDemandaBypassed = true;
          // We're now on the real espectaculo page — continue with normal flow below
          log.info(
            `alta_demanda bypassed for event ${eventId}, continuing with normal extraction`,
          );
          // Shared data was read before navigation; canonical + function URLs
          // must use the current espectaculo URL, not the stale alta_demanda URL
          // (otherwise FUNCTION_DETAIL hits alta_demanda and ERR_TOO_MANY_REDIRECTS).
          sharedData.externalUrl = this.buildCanonicalEventUrl(page.url());
        } else {
          // Still on alta_demanda — scrape what we can with empty ticket waves
          log.info(
            `alta_demanda queue active for event ${eventId}, extracting limited data`,
          );

          const startDate = await this.extractAltaDemandaDate(page);
          if (!startDate) {
            log.info(`Could not parse date for alta_demanda event ${eventId}`);
            return;
          }

          this.validateAndAddEvent({
            externalId: eventId,
            platform: Platform.Tickantel,
            name: sharedData.name,
            description: sharedData.description,
            eventStartDate: startDate,
            eventEndDate: addHours(startDate, DEFAULT_EVENT_DURATION_HOURS),
            scrapedVenueName: sharedData.scrapedVenueName,
            scrapedVenueAddress: sharedData.scrapedVenueAddress,
            scrapedVenueLatitude: sharedData.scrapedVenueLatitude,
            scrapedVenueLongitude: sharedData.scrapedVenueLongitude,
            externalUrl: sharedData.externalUrl,
            images: sharedData.imageUrl
              ? [{type: ScrapedImageType.Hero, url: sharedData.imageUrl}]
              : [],
            ticketWaves: [],
          });

          this.urlsProcessed++;
          return;
        }
      }

      // Discover functions from the carousel — always use current URL (e.g. after
      // alta_demanda → espectaculo navigation) so buildFunctionUrl is not based on
      // the initial request URL.
      const functions = await this.extractFunctions(page, page.url());

      if (functions.length > 1 && altaDemandaBypassed) {
        // Cold page.goto to idFuncionSeleccionada URLs still hits ERR_TOO_MANY_REDIRECTS
        // for some alta_demanda events — Wicket needs the session from bypass + in-page
        // navigation. Scrape every function by clicking the carousel on this page.
        log.info(
          `Found ${functions.length} functions for event ${eventId} after alta_demanda bypass; same-page carousel scrape (no FUNCTION_DETAIL queue)`,
        );
        await this.scrapeMultiFunctionsOnSamePage(
          page,
          log,
          sharedData,
          eventId,
          functions,
        );
      } else if (functions.length > 1) {
        // Multi-function: enqueue each function URL as a FUNCTION_DETAIL request
        log.info(
          `Found ${functions.length} functions for event ${eventId}, enqueueing each`,
        );

        const functionRequests = functions.map(fn => ({
          url: fn.url,
          userData: {
            label: RequestLabel.FUNCTION_DETAIL,
            functionId: fn.functionId,
            sharedData,
          },
        }));

        await crawler.addRequests(functionRequests);
      } else {
        // Single function (no carousel or exactly one): extract everything from this page
        log.info(`Single function for event ${eventId}, extracting from page`);

        const startDate = await this.extractSingleFunctionDate(page);
        if (!startDate) {
          log.info(`Could not parse date for event ${eventId}`);
          return;
        }

        const ticketWaves = await this.extractTicketWaves(page);
        const externalId =
          functions.length === 1 && functions[0].functionId
            ? `${eventId}-${functions[0].functionId}`
            : eventId;

        this.validateAndAddEvent({
          externalId,
          platform: Platform.Tickantel,
          name: sharedData.name,
          description: sharedData.description,
          eventStartDate: startDate,
          eventEndDate: addHours(startDate, DEFAULT_EVENT_DURATION_HOURS),
          scrapedVenueName: sharedData.scrapedVenueName,
          scrapedVenueAddress: sharedData.scrapedVenueAddress,
          scrapedVenueLatitude: sharedData.scrapedVenueLatitude,
          scrapedVenueLongitude: sharedData.scrapedVenueLongitude,
          externalUrl: sharedData.externalUrl,
          images: sharedData.imageUrl
            ? [{type: ScrapedImageType.Hero, url: sharedData.imageUrl}]
            : [],
          ticketWaves,
        });

        this.urlsProcessed++;
      }
    } catch (error) {
      log.error(
        `Error processing detail page ${url}: ${getStringFromError(error)}`,
      );
    }
  };

  /**
   * After alta_demanda bypass, scrape each carousel function without enqueueing
   * FUNCTION_DETAIL — cold `goto` to idFuncionSeleccionada can ERR_TOO_MANY_REDIRECTS
   * even with Wicket ?NN; clicking the calendar preserves the session.
   */
  private async scrapeMultiFunctionsOnSamePage(
    page: Page,
    log: {info: (msg: string, data?: Record<string, unknown>) => void},
    sharedData: SharedEventData,
    eventId: string,
    functions: Array<{functionId: string; url: string}>,
  ): Promise<void> {
    for (const fn of functions) {
      try {
        log.info('Tickantel same-page function: clicking carousel', {
          eventId,
          functionId: fn.functionId,
          urlBeforeClick: page.url(),
        });

        const fnLink = page
          .locator(`#calendar-select a[href*="${fn.functionId}"]`)
          .first();

        await fnLink.waitFor({state: 'visible', timeout: 15000});
        await fnLink.scrollIntoViewIfNeeded().catch(() => {});

        await page
          .waitForSelector('.loading', {state: 'hidden', timeout: 3000})
          .catch(() => {});

        await fnLink.click({timeout: 15000});

        await page
          .waitForSelector('.loading', {state: 'hidden', timeout: 15000})
          .catch(() => {});
        await page.waitForTimeout(500);

        await page.waitForSelector('.filter-content h3', {timeout: 15000});

        const startDate = await this.extractSingleFunctionDate(page);
        if (!startDate) {
          log.info('Tickantel same-page function: could not parse date', {
            eventId,
            functionId: fn.functionId,
            urlAfterClick: page.url(),
          });
          continue;
        }

        const ticketWaves = await this.extractTicketWaves(page);

        this.validateAndAddEvent({
          externalId: `${eventId}-${fn.functionId}`,
          platform: Platform.Tickantel,
          name: sharedData.name,
          description: sharedData.description,
          eventStartDate: startDate,
          eventEndDate: addHours(startDate, DEFAULT_EVENT_DURATION_HOURS),
          scrapedVenueName: sharedData.scrapedVenueName,
          scrapedVenueAddress: sharedData.scrapedVenueAddress,
          scrapedVenueLatitude: sharedData.scrapedVenueLatitude,
          scrapedVenueLongitude: sharedData.scrapedVenueLongitude,
          externalUrl: sharedData.externalUrl,
          images: sharedData.imageUrl
            ? [{type: ScrapedImageType.Hero, url: sharedData.imageUrl}]
            : [],
          ticketWaves,
        });

        this.urlsProcessed++;

        log.info('Tickantel same-page function: extracted', {
          eventId,
          functionId: fn.functionId,
          urlAfterClick: page.url(),
          ticketWaveCount: ticketWaves.length,
        });
      } catch (err) {
        log.info(
          `Tickantel same-page function failed ${eventId}/${fn.functionId}: ${getStringFromError(err)}`,
        );
      }
    }
  }

  /**
   * FUNCTION_DETAIL handler: extract date + ticket waves for a specific function.
   * Merges with shared event data passed via userData.
   */
  private handleFunctionDetailRequest: PlaywrightRequestHandler =
    async args => {
      const {page, request, log} = args;
      const url = page.url();
      const {functionId, sharedData} = request.userData as {
        functionId: string;
        sharedData: SharedEventData;
      };

      try {
        await page.waitForSelector('.filter-content h3', {timeout: 15000});

        const startDate = await this.extractSingleFunctionDate(page);
        if (!startDate) {
          log.info(`Could not parse date for function ${functionId} at ${url}`);
          return;
        }

        const ticketWaves = await this.extractTicketWaves(page);

        this.validateAndAddEvent({
          externalId: `${sharedData.eventId}-${functionId}`,
          platform: Platform.Tickantel,
          name: sharedData.name,
          description: sharedData.description,
          eventStartDate: startDate,
          eventEndDate: addHours(startDate, DEFAULT_EVENT_DURATION_HOURS),
          scrapedVenueName: sharedData.scrapedVenueName,
          scrapedVenueAddress: sharedData.scrapedVenueAddress,
          scrapedVenueLatitude: sharedData.scrapedVenueLatitude,
          scrapedVenueLongitude: sharedData.scrapedVenueLongitude,
          externalUrl: sharedData.externalUrl,
          images: sharedData.imageUrl
            ? [{type: ScrapedImageType.Hero, url: sharedData.imageUrl}]
            : [],
          ticketWaves,
        });

        this.urlsProcessed++;
      } catch (error) {
        log.error(
          `Error processing function detail ${url}: ${getStringFromError(error)}`,
        );
      }
    };

  /**
   * Extract shared event data (name, description, venue, image) from the main event page.
   */
  private async extractSharedEventData(
    page: Page,
    url: string,
    eventId: string,
  ): Promise<SharedEventData | null> {
    try {
      const name = trimTextAndDefaultToEmpty(
        await page.textContent('.espectaculo__title h1'),
      );

      if (!name) {
        logger.warn(`Could not extract event name from ${url}`);
        return null;
      }

      // Description from the info modal body
      const descriptionHtml = await page
        .$eval('#infoModal .modal-body', el => el.innerHTML)
        .catch(() => '');
      const description = descriptionHtml
        ? this.convertHtmlToFormattedText(descriptionHtml)
        : undefined;

      // Venue name from the "Lugar" list item
      const scrapedVenueName = await this.extractVenueName(page);

      // Coordinates from OpenStreetMap iframe in #lugarModal
      const coordinates = await this.extractCoordinates(page);

      // Hero image
      const imageUrl = await page
        .getAttribute('.col-md-4 img.img-responsive', 'src')
        .catch(() => null);

      // Canonical external URL: use the base event page (not a function-specific URL)
      const canonicalUrl = this.buildCanonicalEventUrl(url);

      return {
        eventId,
        name,
        description: description || undefined,
        scrapedVenueName: scrapedVenueName || undefined,
        scrapedVenueAddress: scrapedVenueName || 'Uruguay',
        scrapedVenueLatitude: coordinates?.latitude,
        scrapedVenueLongitude: coordinates?.longitude,
        imageUrl: imageUrl || undefined,
        externalUrl: canonicalUrl,
      };
    } catch (error) {
      logger.error(`Error extracting shared data from ${url}:`, error);
      return null;
    }
  }

  /**
   * Attempt to bypass the alta_demanda virtual queue by clicking "Continuar"
   * and waiting for navigation. If the queue is open, we land on the real
   * espectaculo page instantly. If not (still on alta_demanda or in a queue),
   * returns false so the caller can fall back to limited extraction.
   */
  private async tryBypassAltaDemanda(
    page: Page,
    log: {info: (msg: string, data?: Record<string, unknown>) => void},
  ): Promise<boolean> {
    try {
      const continueBtn = await page.$('button[name="irAVqueue"]');
      if (!continueBtn) {
        log.info('alta_demanda: no "Continuar" button found');
        return false;
      }

      // Click and wait for navigation (the form submits and triggers redirects)
      await Promise.all([
        page.waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        }),
        continueBtn.click(),
      ]);

      const newUrl = page.url();

      // If we landed on the real espectaculo page (with /espectaculo/ and NOT
      // /alta_demanda/), the bypass worked
      if (
        newUrl.includes('/espectaculo/') &&
        !newUrl.includes('/alta_demanda/')
      ) {
        log.info(`alta_demanda: bypassed successfully, now at ${newUrl}`);
        // Wait for the event page to render
        await page
          .waitForSelector('.espectaculo__title h1', {timeout: 10000})
          .catch(() => {});
        return true;
      }

      log.info(
        `alta_demanda: bypass did not reach espectaculo page, at ${newUrl}`,
      );
      return false;
    } catch (error) {
      logger.debug('alta_demanda bypass attempt failed:', error);
      return false;
    }
  }

  /**
   * Extract all functions from the carousel on the event page.
   * Returns an empty array if no carousel is present (single-function event).
   */
  private async extractFunctions(
    page: Page,
    pageUrl: string,
  ): Promise<Array<{functionId: string; url: string}>> {
    try {
      // Wait briefly for the carousel to render (Owl Carousel initializes async)
      await page
        .waitForSelector('#calendar-select .item a', {timeout: 3000})
        .catch(() => {});

      // Use the broader selector — #calendar-select .item a — to catch both
      // the initialized Owl layout (.owl-carousel .owl-item .item a) and any
      // pre-init DOM. Dedupe by functionId to avoid Owl clones.
      const hrefs = await page
        .$$eval('#calendar-select .item a', els =>
          els
            .map(a => (a as HTMLAnchorElement).getAttribute('href') || '')
            .filter(Boolean),
        )
        .catch(() => [] as string[]);

      logger.debug('Tickantel extractFunctions hrefs found', {
        count: hrefs.length,
        hrefs,
      });

      if (hrefs.length === 0) return [];

      const results: Array<{functionId: string; url: string}> = [];
      const seen = new Set<string>();

      for (const href of hrefs) {
        // Extract functionId from href — patterns seen:
        //   ./40059175
        //   ./Milo%20J/idFuncionSeleccionada/40059175
        const fnIdMatch = href.match(/(\d+)\s*$/);
        const functionId = fnIdMatch ? fnIdMatch[1] : null;
        if (!functionId || seen.has(functionId)) continue;
        seen.add(functionId);

        const functionUrl = this.buildFunctionUrl(pageUrl, functionId);
        results.push({functionId, url: functionUrl});
      }

      return results;
    } catch (error) {
      logger.debug('Could not extract functions from carousel:', error);
      return [];
    }
  }

  /**
   * Parse the event start date from the "Función:" h3 on the page.
   * Falls back to JSON-LD startDate if parsing fails.
   * Format: "Sábado 25 de abril  -  21:00 hs"
   */
  private async extractSingleFunctionDate(page: Page): Promise<Date | null> {
    // Primary: parse from the "Función" h3 (Uruguay local time)
    const parsed = await this.parseFunctionH3Date(page);
    if (parsed) return parsed;

    // Fallback: JSON-LD startDate (UTC)
    return this.extractJsonLdStartDate(page);
  }

  private async parseFunctionH3Date(page: Page): Promise<Date | null> {
    try {
      const h3Text = trimTextAndDefaultToEmpty(
        await page.textContent('.filter-content h3'),
      );

      if (!h3Text) return null;

      // Pattern: "Función: Sábado 25 de abril  -  21:00 hs"
      // Match day number, month name, hour, optional minute
      const match = h3Text.match(
        /(\d+)\s+de\s+([a-záéíóúñ]+)\s*[-–]\s*(\d+)(?::(\d+))?\s*hs/i,
      );

      if (!match) return null;

      const [, dayStr, monthName, hourStr, minuteStr] = match;
      const monthNum = SPANISH_MONTH_MAP[monthName.toLowerCase()];
      if (monthNum === undefined) return null;

      const day = parseInt(dayStr, 10);
      const hour = parseInt(hourStr, 10);
      const minute = minuteStr ? parseInt(minuteStr, 10) : 0;

      const now = new TZDate(new Date(), URUGUAY_TZ);
      let year = now.getFullYear();

      // If the date has already passed this year, assume next year
      const tentativeDate = new TZDate(year, monthNum, day, URUGUAY_TZ);
      const todayStart = new TZDate(
        year,
        now.getMonth(),
        now.getDate(),
        URUGUAY_TZ,
      );
      if (tentativeDate < todayStart) {
        year++;
      }

      return new TZDate(year, monthNum, day, hour, minute, URUGUAY_TZ);
    } catch {
      return null;
    }
  }

  private async extractJsonLdStartDate(page: Page): Promise<Date | null> {
    try {
      const scripts = await page.$$eval(
        'script[type="application/ld+json"]',
        els => els.map(el => el.textContent || ''),
      );

      for (const scriptText of scripts) {
        try {
          const data = JSON.parse(scriptText) as Record<string, unknown>;
          if (data['@type'] === 'Event' && typeof data.startDate === 'string') {
            const date = new Date(data.startDate);
            if (!isNaN(date.getTime())) return date;
          }
        } catch {
          // skip malformed JSON
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract the venue name from the "Lugar" list item.
   */
  private async extractVenueName(page: Page): Promise<string | null> {
    try {
      // The HTML structure is:
      //   <ul class="list-inline">
      //     <strong>Lugar</strong>
      //     <li class="list-inline-item"><span>Antel Arena</span>...</li>
      //   </ul>
      // We find every ul.list-inline, check if its direct strong says "Lugar",
      // then return the text of the first list-inline-item span.
      const uls = await page.$$('.espectaculo__info ul.list-inline');
      for (const ul of uls) {
        const strongText = await ul
          .$eval('strong', el => el.textContent?.trim() || '')
          .catch(() => '');
        if (strongText === 'Lugar') {
          const spanText = await ul
            .$eval(
              'li.list-inline-item span',
              el => el.textContent?.trim() || '',
            )
            .catch(() => null);
          if (spanText) return spanText;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract coordinates from the OpenStreetMap iframe in #lugarModal.
   * Parses the `marker=lat,lng` param from the iframe src.
   */
  private async extractCoordinates(
    page: Page,
  ): Promise<{latitude: number; longitude: number} | null> {
    try {
      const iframeSrc = await page.getAttribute(
        '#lugarModal iframe[src*="openstreetmap"]',
        'src',
      );

      if (!iframeSrc) return null;

      // Parse marker=lat,lng
      const match = iframeSrc.match(/marker=(-?[\d.]+),(-?[\d.]+)/);
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
   * Extract all ticket waves from the current page's .lista-visibilidad items.
   */
  private async extractTicketWaves(page: Page): Promise<ScrapedTicketWave[]> {
    try {
      const waves = await page.$$eval(
        '.lista-visibilidad.auto-lista-visibilidad',
        containers => {
          const result: Array<{
            externalId: string;
            name: string;
            faceValue: number;
            isSoldOut: boolean;
            isAvailable: boolean;
          }> = [];

          containers.forEach(container => {
            const name =
              container
                .querySelector('.auto-nombre-VisibilidadSector')
                ?.textContent?.trim() || '';

            const priceText =
              container.querySelector('.auto-col-costo')?.textContent?.trim() ||
              '';

            const availabilityText =
              container
                .querySelector('.auto-disponibilidad')
                ?.textContent?.trim() || '';

            const isSoldOut =
              container.classList.contains('disabled') ||
              availabilityText.toLowerCase().includes('agotada');

            const isAvailable = !isSoldOut;

            // Parse price: "$ 2630.0" -> 2630
            const priceMatch = priceText.match(/[\d.,]+/);
            const faceValue = priceMatch
              ? parseFloat(priceMatch[0].replace(',', '.'))
              : 0;

            // ExternalId from buy link's idVisibilidad param
            const buyLink = container.querySelector(
              'a[href*="idVisibilidad"]',
            ) as HTMLAnchorElement | null;
            const visibilidadMatch =
              buyLink?.href?.match(/idVisibilidad=(\d+)/);
            const externalId = visibilidadMatch
              ? visibilidadMatch[1]
              : `${name}-${faceValue}`;

            if (name) {
              result.push({
                externalId,
                name,
                faceValue,
                isSoldOut,
                isAvailable,
              });
            }
          });

          return result;
        },
      );

      return waves.map(w => ({
        ...w,
        currency: 'UYU' as const,
      }));
    } catch (error) {
      logger.debug('Could not extract ticket waves:', error);
      return [];
    }
  }

  /**
   * Extract the event date from the alta_demanda page.
   * The page shows the date in `.espectaculo__date span` as "sábado 24 de octubre"
   * and in `.espectaculo__info` as "24/10/2026".
   * No time is shown, so we default to 21:00 (common concert start time in Uruguay).
   */
  private async extractAltaDemandaDate(page: Page): Promise<Date | null> {
    try {
      // Try the structured date from .espectaculo__info: "24/10/2026"
      const dateText = trimTextAndDefaultToEmpty(
        await page
          .$eval(
            '.espectaculo__info li strong + span span:last-child',
            el => el.textContent,
          )
          .catch(() => null),
      );

      if (dateText) {
        // Format: DD/MM/YYYY
        const match = dateText.match(/(\d+)\/(\d+)\/(\d+)/);
        if (match) {
          const [, day, month, year] = match;
          // Default to 21:00 since alta_demanda pages don't show the time
          return new TZDate(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            21,
            0,
            URUGUAY_TZ,
          );
        }
      }

      // Fallback: parse the human-readable date from .espectaculo__date
      const dateSpanText = trimTextAndDefaultToEmpty(
        await page
          .$eval('.espectaculo__date span:last-child', el => el.textContent)
          .catch(() => null),
      );

      if (dateSpanText) {
        // Format: "sábado 24 de octubre"
        const match = dateSpanText.match(/(\d+)\s+de\s+([a-záéíóúñ]+)/i);
        if (match) {
          const [, dayStr, monthName] = match;
          const monthNum = SPANISH_MONTH_MAP[monthName.toLowerCase()];
          if (monthNum !== undefined) {
            const day = parseInt(dayStr, 10);
            const now = new TZDate(new Date(), URUGUAY_TZ);
            let year = now.getFullYear();
            const tentativeDate = new TZDate(year, monthNum, day, URUGUAY_TZ);
            const todayStart = new TZDate(
              year,
              now.getMonth(),
              now.getDate(),
              URUGUAY_TZ,
            );
            if (tentativeDate < todayStart) year++;
            return new TZDate(year, monthNum, day, 21, 0, URUGUAY_TZ);
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract the numeric eventId from a Tickantel event URL.
   * e.g. https://tickantel.com.uy/inicio/espectaculo/40019981/espectaculo/...
   */
  private extractEventIdFromUrl(url: string): string {
    const match = url.match(/\/espectaculo\/(\d+)\//);
    return match ? match[1] : '';
  }

  /**
   * Build the canonical event URL (strip any idFuncionSeleccionada suffix and session params).
   */
  private buildCanonicalEventUrl(url: string): string {
    // Remove session param suffix (e.g., ?8) and any function-specific path
    const withoutSession = url.replace(/\?\d+$/, '');
    // Remove /idFuncionSeleccionada/... suffix if present
    const withoutFunction = withoutSession.replace(
      /\/idFuncionSeleccionada\/\d+.*/,
      '',
    );
    return withoutFunction;
  }

  /**
   * Build the absolute URL for a function-specific page.
   * The carousel href can be relative (./40059175) or include the full path segment.
   *
   * Preserves the trailing Wicket page-map suffix (`?NN`) from the current page.
   * Without it, some events (especially after alta_demanda bypass) return
   * net::ERR_TOO_MANY_REDIRECTS on a cold `goto` to idFuncionSeleccionada URLs.
   */
  private buildFunctionUrl(pageUrl: string, functionId: string): string {
    const sessionMatch = pageUrl.match(/\?(\d+)$/);
    const sessionSuffix = sessionMatch ? `?${sessionMatch[1]}` : '';

    const urlWithoutSession = pageUrl.replace(/\?\d+$/, '');
    const basePath = urlWithoutSession.replace(
      /\/idFuncionSeleccionada\/\d+.*/,
      '',
    );

    return `${basePath}/idFuncionSeleccionada/${functionId}${sessionSuffix}`;
  }

  private validateAndAddEvent(eventData: Partial<ScrapedEventData>) {
    const validationResult = ScrapedEventDataSchema.safeParse(eventData);

    if (!validationResult.success) {
      logger.error('Invalid Tickantel event data:', validationResult.error);
      logger.debug('Event data that failed validation:', eventData);
      return;
    }

    this.events.push(validationResult.data);
  }
}
