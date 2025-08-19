import {PlaywrightRequestHandler} from 'crawlee';
import {BaseScraper} from '../base';
import {
  Platform,
  ScrapedEventData,
  ScrapedEventDataSchema,
  ScrapedImageType,
  ScrapedTicketWave,
} from '../base/types';
import {
  DateUtils,
  getStringFromError,
  trimTextAndDefaultToEmpty,
  logger,
} from '~/utils';
import {addMinutes} from 'date-fns';

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

      logger.info(`Scraped ${this.events.length} events from Entraste`);
      return this.events;
    } catch (error) {
      logger.error('Error scraping Entraste events:', error);
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

      logger.info(`Scraped ${waves.length} ticket waves for event ${eventId}`);
      return waves;
    } catch (error) {
      logger.error(`Error scraping ticket waves for event ${eventId}:`, error);
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

    let parsedDateTime: {
      startTime: Date | undefined;
      endTime: Date | undefined;
    } | null = null;

    if (dateTimeText.startsWith('Desde el')) {
      parsedDateTime = this.handleMultiDayEvent(dateTimeText);
    } else {
      parsedDateTime = this.handleSingleDayEvent(dateTimeText);
    }

    if (!parsedDateTime) {
      throw new Error(
        `Could not parse date/time information, dateString: ${dateTimeText}`,
      );
    }

    return parsedDateTime;
  }

  private handleMultiDayEvent(dateString: string): {
    startTime: Date | undefined;
    endTime: Date | undefined;
  } {
    // Pattern: "Desde el viernes 10 de octubre a las 23:59 hasta el domingo 12 de octubre a las 06:00"
    const dateTimeMatch = dateString.match(
      /Desde el ([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+a\s+las\s+(\d+):(\d+)\s+hasta\s+el\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+a\s+las\s+(\d+):(\d+)/,
    );

    if (!dateTimeMatch) {
      logger.warn('Could not parse multi-day event date:', dateString);
      return {startTime: undefined, endTime: undefined};
    }

    const [
      _fullMatch,
      _startDayOfWeek, // viernes
      startDay, // 10
      startMonth, // octubre
      startHour, // 23
      startMinute, // 59
      _endDayOfWeek, // domingo
      endDay, // 12
      endMonth, // octubre
      endHour, // 06
      endMinute, // 00
    ] = dateTimeMatch;

    const startDate = DateUtils.fromSpanishStrings({
      dayString: startDay,
      monthString: startMonth,
      hour: startHour,
      minutes: startMinute,
      timezone: 'America/Montevideo',
    });

    const endDate = DateUtils.fromSpanishStrings({
      dayString: endDay,
      monthString: endMonth,
      hour: endHour,
      minutes: endMinute,
      timezone: 'America/Montevideo',
    });

    if (endDate < startDate) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return {startTime: startDate, endTime: endDate};
  }

  private handleSingleDayEvent(dateString: string): {
    startTime: Date | undefined;
    endTime: Date | undefined;
  } {
    logger.debug('Parsing single-day event date string:', dateString);
    // Pattern: "Jueves 21 de agosto\ndesde las 23:59 hasta las 06:00"
    // Also handles single-line format: "Jueves 21 de agosto desde las 23:59 hasta las 06:00"
    const dateTimeMatch = dateString.match(
      /([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s*(?:desde\s+)?las\s+(\d+):(\d+)\s+hasta\s+las\s+(\d+):(\d+)/,
    );

    if (!dateTimeMatch) {
      logger.warn('Could not parse single-day event date:', dateString);
      return {startTime: undefined, endTime: undefined};
    }

    const [
      _fullMatch,
      _dayOfWeek, // jueves
      day, // 21
      month, // agosto
      startHour, // 23
      startMinute, // 59
      endHour, // 06
      endMinute, // 00
    ] = dateTimeMatch;

    try {
      logger.debug(
        `Parsed values: day=${day}, month=${month}, start=${startHour}:${startMinute}, end=${endHour}:${endMinute}`,
      );

      // Create start date using the parsed day and month
      const startDate = DateUtils.fromSpanishStrings({
        dayString: day,
        monthString: month,
        hour: startHour,
        minutes: startMinute,
        timezone: 'America/Montevideo',
      });

      // Calculate the time difference to determine end date
      const startHourNum = parseInt(startHour);
      const startMinuteNum = parseInt(startMinute);
      const endHourNum = parseInt(endHour);
      const endMinuteNum = parseInt(endMinute);

      // Calculate total minutes from start to end
      let totalMinutes = 0;

      if (
        endHourNum < startHourNum ||
        (endHourNum === startHourNum && endMinuteNum < startMinuteNum)
      ) {
        // Event crosses midnight - calculate time until midnight + time from midnight
        const minutesUntilMidnight =
          24 * 60 - (startHourNum * 60 + startMinuteNum);
        const minutesFromMidnight = endHourNum * 60 + endMinuteNum;
        totalMinutes = minutesUntilMidnight + minutesFromMidnight;
        logger.debug(
          `Event crosses midnight: ${totalMinutes} total minutes (${minutesUntilMidnight} until midnight + ${minutesFromMidnight} from midnight)`,
        );
      } else {
        // Event ends on the same day
        totalMinutes =
          endHourNum * 60 + endMinuteNum - (startHourNum * 60 + startMinuteNum);
        logger.debug(`Event ends same day: ${totalMinutes} total minutes`);
      }

      // Use date-fns to add the calculated minutes to the start date
      const endDate = addMinutes(startDate, totalMinutes);

      return {startTime: startDate, endTime: endDate};
    } catch (error) {
      logger.warn('Error parsing single-day event date:', error);
      return {startTime: undefined, endTime: undefined};
    }
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
      // exclude: [
      //   // Exclude anything that is not the specific URL
      //   /^(?!https:\/\/entraste\.com\/evento\/cloud-7-jueves-coqeein-montana-venta$).*/,
      // ],
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
      throw error;
    }
  };

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
