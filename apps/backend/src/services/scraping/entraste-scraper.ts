import {PlaywrightRequestHandler} from 'crawlee';
import {BaseScraper} from './base-scraper';
import {
  Platform,
  ScrapedEventData,
  ScrapedEventDataSchema,
  ScrapedImageType,
  ScrapedTicketWave,
} from './types';
import {getStringFromError, trimTextAndDefaultToEmpty} from '~/utils';
import {parse, setHours, setMinutes, addDays} from 'date-fns';
import {es} from 'date-fns/locale';

enum RequestLabel {
  LIST = 'LIST',
  DETAIL = 'DETAIL',
}

export class EntrasteScraper extends BaseScraper {
  private events: ScrapedEventData[] = [];
  private baseUrl = 'https://entraste.com';

  constructor() {
    super(Platform.Entraste);
  }

  async scrapeEvents(): Promise<ScrapedEventData[]> {
    const userAgent =
      this.config.headers?.['User-Agent'] ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const crawler = this.createCrawler({
      launchContext: {
        userAgent,
      },
      // maxRequestsPerCrawl: 2,
      requestHandler: this.handleRequest,
      failedRequestHandler({request, log}) {
        log.info(`Request ${request.url} failed too many times.`);
      },
    });

    try {
      await crawler.addRequests([
        {
          url: `${this.baseUrl}`,
          userData: {
            label: RequestLabel.LIST,
          },
        },
      ]);
      await crawler.run();

      console.log(`Scraped ${this.events.length} events from Entraste`);
      console.log(this.events);
      return this.events;
    } catch (error) {
      console.error('Error scraping Entraste events:', error);
      throw error;
    }
  }

  async scrapeTicketWaves(eventId: string): Promise<ScrapedTicketWave[]> {
    const waves: ScrapedTicketWave[] = [];
    const extractPrice = this.extractPrice.bind(this);

    const crawler = this.createCrawler({
      async requestHandler({pushData, request, page, log}) {
        log.info(`Processing event page: ${request.url}`);

        // Set user agent and viewport
        await page.setViewportSize({width: 1920, height: 1080});

        // Block unnecessary resources for faster scraping
        await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route =>
          route.abort(),
        );

        // Wait for the page to load (adjust selector based on actual page structure)
        await page.waitForSelector(
          '.ticket-type, .ticket-wave, .entrada-tipo',
          {timeout: 10000},
        );

        // Extract ticket wave data using page.$$eval
        const waveData = await page.$$eval(
          '.ticket-type, .ticket-wave, .entrada-tipo',
          $tickets => {
            const scrapedWaves: any[] = [];

            $tickets.forEach($ticket => {
              const wave_id =
                $ticket.getAttribute('data-wave-id') ||
                $ticket.getAttribute('id') ||
                '';
              const name =
                $ticket
                  .querySelector('.ticket-name, .wave-name')
                  ?.textContent?.trim() || '';
              const price_text =
                $ticket.querySelector('.price, .precio')?.textContent?.trim() ||
                '';
              const description =
                $ticket
                  .querySelector('.description, .descripcion')
                  ?.textContent?.trim() || '';
              const category =
                $ticket
                  .querySelector('.category, .categoria')
                  ?.textContent?.trim() || '';
              const benefits =
                $ticket
                  .querySelector('.benefits, .beneficios')
                  ?.textContent?.trim() || '';

              if (wave_id && name && price_text) {
                scrapedWaves.push({
                  wave_id,
                  name,
                  price_text,
                  description,
                  category,
                  benefits,
                });
              }
            });

            return scrapedWaves;
          },
        );

        // Process and format the data
        for (const wave of waveData) {
          const face_value = extractPrice(wave.price_text);

          if (face_value > 0) {
            const scrapedWave: ScrapedTicketWave = {
              external_wave_id: wave.wave_id,
              name: wave.name,
              description: wave.description,
              face_value,
              currency: 'UYU',
              sale_start: undefined,
              sale_end: undefined,
              total_quantity: undefined,
              sold_quantity: undefined,
              platform_data: {
                wave_id: wave.wave_id,
                category: wave.category,
                benefits: wave.benefits,
              },
            };

            waves.push(scrapedWave);
          }
        }

        log.info(`Found ${waveData.length} ticket waves`);
      },

      failedRequestHandler({request, log}) {
        log.info(`Request ${request.url} failed too many times.`);
      },
    });

    try {
      await crawler.addRequests([`${this.baseUrl}/evento/${eventId}`]);
      await crawler.run();

      console.log(`Scraped ${waves.length} ticket waves for event ${eventId}`);
      return waves;
    } catch (error) {
      console.error(`Error scraping ticket waves for event ${eventId}:`, error);
      throw error;
    }
  }

  handleRequest: PlaywrightRequestHandler = async args => {
    const {request, log} = args;
    log.info(`▶️  ${request.userData.label}  ${request.url}`);

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
  };

  /**
   * Extract basic event information (name, description)
   */
  private async extractBasicEventInfo(
    page: any,
  ): Promise<{name: string; description: string}> {
    const name = trimTextAndDefaultToEmpty(
      await page.textContent('.event-info-title'),
    );

    // Extract description with proper line breaks
    const description = await this.extractFormattedDescription(page);

    return {name, description};
  }

  /**
   * Extract description with proper HTML to text formatting
   */
  private async extractFormattedDescription(page: any): Promise<string> {
    const descriptionHtml = await page.innerHTML('#event-description');
    if (!descriptionHtml) return '';

    // Convert HTML to formatted text with line breaks
    return this.convertHtmlToFormattedText(descriptionHtml);
  }

  /**
   * Convert HTML content to formatted text with proper line breaks
   */
  private convertHtmlToFormattedText(html: string): string {
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

  /**
   * Extract venue information
   */
  private async extractVenueInfo(
    page: any,
  ): Promise<{venueName: string; venueAddress: string}> {
    const venueName = trimTextAndDefaultToEmpty(
      await page.textContent('.location-section h3'),
    );
    const venueAddress = trimTextAndDefaultToEmpty(
      await page.textContent('.location-section p'),
    );
    return {venueName, venueAddress};
  }

  /**
   * Extract and parse date/time information
   */
  private async extractDateTimeInfo(
    page: any,
  ): Promise<{startTime: Date | undefined; endTime: Date | undefined}> {
    const dateTimeText = trimTextAndDefaultToEmpty(
      await page.textContent('.location-section h2[data-eventstart] + p'),
    );

    const dateTimeMatch = dateTimeText.match(
      /([a-zA-ZáéíóúñÁÉÍÓÚÑ]+) (\d+) de ([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+desde las (\d+):(\d+) hasta las (\d+):(\d+)/,
    );

    if (!dateTimeMatch) {
      console.warn('Could not parse date and time from text', dateTimeText);
      return {startTime: undefined, endTime: undefined};
    }

    const [
      _originalText,
      dayOfWeekInSpanish,
      day,
      monthInSpanish,
      startHour,
      startMinute,
      endHour,
      endMinute,
    ] = dateTimeMatch;

    // Parse the Spanish date and time
    const parsedDateTime = this.parseSpanishDateTime(
      dayOfWeekInSpanish,
      day,
      monthInSpanish,
      startHour,
      startMinute,
      endHour,
      endMinute,
    );

    if (parsedDateTime) {
      return parsedDateTime;
    }

    // Fallback to using the timestamp from data attribute
    const eventStartTimestamp = await page.getAttribute(
      'h2[data-eventstart]',
      'data-eventstart',
    );

    if (!eventStartTimestamp) {
      console.warn('Could not find event start timestamp');
      return {startTime: undefined, endTime: undefined};
    }

    const startTimestamp = parseInt(eventStartTimestamp) * 1000;
    const startTime = new Date(startTimestamp);

    // Calculate end time based on the parsed hours
    const endTimestamp = new Date(startTimestamp);
    const endHourNum = parseInt(endHour);
    const endMinuteNum = parseInt(endMinute);

    if (endHourNum < parseInt(startHour)) {
      endTimestamp.setDate(endTimestamp.getDate() + 1);
    }

    endTimestamp.setHours(endHourNum, endMinuteNum, 0, 0);
    const endTime = endTimestamp;

    return {startTime, endTime};
  }

  /**
   * Extract image URLs
   */
  private async extractImageUrls(
    page: any,
  ): Promise<{flyerImgSrc: string | null; heroImgSrc: string | null}> {
    const flyerImgSrc = await page.getAttribute('img.event-flyer-image', 'src');
    const heroImgSrc = await page.getAttribute(
      'img.event-flyer-imagebox',
      'src',
    );
    return {flyerImgSrc, heroImgSrc};
  }

  private handleListRequest: PlaywrightRequestHandler = async args => {
    const {enqueueLinks} = args;
    await enqueueLinks({
      selector: 'a.event-card',
      transformRequestFunction: req => {
        req.userData = {label: 'DETAIL'};
        return req;
      },
    });
  };

  private handleDetailRequest: PlaywrightRequestHandler = async args => {
    const {page, log} = args;
    const url = page.url();

    try {
      // Extract all event data using single-responsibility methods
      const {name, description} = await this.extractBasicEventInfo(page);
      const {venueName, venueAddress} = await this.extractVenueInfo(page);
      const {startTime, endTime} = await this.extractDateTimeInfo(page);
      const {flyerImgSrc, heroImgSrc} = await this.extractImageUrls(page);

      const eventData: Partial<ScrapedEventData> = {
        externalId: url,
        platform: Platform.Entraste,
        name,
        description,
        venueName,
        venueAddress,
        eventStartDate: startTime,
        eventEndDate: endTime,
        externalUrl: url,
        images: [
          {
            type: ScrapedImageType.Flyer,
            url: flyerImgSrc || '',
          },
          {
            type: ScrapedImageType.Hero,
            url: heroImgSrc || '',
          },
        ],
      };

      this.validateAndAddEvent(eventData);
    } catch (error) {
      log.error(`Error extracting event details: ${getStringFromError(error)}`);
    }
  };

  /**
   * Parse Spanish date and time strings into Date objects
   */
  private parseSpanishDateTime(
    dayOfWeekInSpanish: string,
    day: string,
    monthInSpanish: string,
    startHour: string,
    startMinute: string,
    endHour: string,
    endMinute: string,
  ): {startTime: Date; endTime: Date} | null {
    try {
      // Parse the date using Spanish locale
      const dateString = `${day} ${monthInSpanish}`;
      const currentYear = new Date().getFullYear();

      // Try to parse the date with Spanish locale
      const baseDate = parse(
        dateString,
        'd MMMM',
        new Date(currentYear, 0, 1),
        {
          locale: es,
        },
      );

      // Set the start time
      const startTime = setMinutes(
        setHours(baseDate, parseInt(startHour)),
        parseInt(startMinute),
      );

      // Set the end time
      let endTime = setMinutes(
        setHours(baseDate, parseInt(endHour)),
        parseInt(endMinute),
      );

      // If end hour is less than start hour, it's the next day
      if (parseInt(endHour) < parseInt(startHour)) {
        endTime = addDays(endTime, 1);
      }

      return {startTime, endTime};
    } catch (error) {
      console.error('Error parsing Spanish date:', error);
      return null;
    }
  }

  private validateAndAddEvent(eventData: Partial<ScrapedEventData>) {
    const validationResult = ScrapedEventDataSchema.safeParse(eventData);
    if (!validationResult.success) {
      console.error('Invalid event data:', validationResult.error);
      console.log(eventData);
      return;
    }

    this.events.push(validationResult.data);
  }
}
