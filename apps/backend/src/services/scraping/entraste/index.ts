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
import {addMinutes, isPast, setYear} from 'date-fns';
import {Page} from 'playwright';

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
    page: Page,
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
  private async extractFormattedDescription(page: Page): Promise<string> {
    const descriptionHtml = await page.innerHTML('#event-description');
    if (!descriptionHtml) return '';

    // Convert HTML to formatted text with line breaks
    return this.convertHtmlToFormattedText(descriptionHtml);
  }

  /**
   * Extract venue information
   */
  private async extractVenueInfo(
    page: Page,
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
  ): Promise<{startDate: Date | undefined; endDate: Date | undefined}> {
    const dateTimeText = trimTextAndDefaultToEmpty(
      await page.textContent('.location-section h2[data-eventstart] + p'),
    );

    let parsedDateTime: {
      startDate: Date | undefined;
      endDate: Date | undefined;
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
    startDate: Date | undefined;
    endDate: Date | undefined;
  } {
    // Pattern: "Desde el viernes 10 de octubre a las 23:59 hasta el domingo 12 de octubre a las 06:00"
    const dateTimeMatch = dateString.match(
      /Desde el ([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+a\s+las\s+(\d+):(\d+)\s+hasta\s+el\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+a\s+las\s+(\d+):(\d+)/,
    );

    if (!dateTimeMatch) {
      logger.warn('Could not parse multi-day event date:', dateString);
      return {startDate: undefined, endDate: undefined};
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

    const eventIsNextYear = isPast(startDate) && isPast(endDate);
    if (eventIsNextYear) {
      setYear(startDate, new Date().getFullYear() + 1);
      setYear(endDate, new Date().getFullYear() + 1);
    }

    if (endDate < startDate) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return DateUtils.fixNextYearEdgeCase(startDate, endDate);
  }

  private handleSingleDayEvent(dateString: string): {
    startDate: Date | undefined;
    endDate: Date | undefined;
  } {
    logger.debug('Parsing single-day event date string:', dateString);
    // Pattern: "Jueves 21 de agosto\ndesde las 23:59 hasta las 06:00"
    // Also handles single-line format: "Jueves 21 de agosto desde las 23:59 hasta las 06:00"
    const dateTimeMatch = dateString.match(
      /([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+(\d+)\s+de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s*(?:desde\s+)?las\s+(\d+):(\d+)\s+hasta\s+las\s+(\d+):(\d+)/,
    );

    if (!dateTimeMatch) {
      logger.warn('Could not parse single-day event date:', dateString);
      return {startDate: undefined, endDate: undefined};
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

      return DateUtils.fixNextYearEdgeCase(startDate, endDate);
    } catch (error) {
      logger.warn('Error parsing single-day event date:', error);
      return {startDate: undefined, endDate: undefined};
    }
  }

  /**
   * Extract image URLs
   */
  private async extractImageUrls(
    page: Page,
  ): Promise<{flyerImgSrc: string | null; heroImgSrc: string | null}> {
    const flyerImgSrc = await page.getAttribute('img.hero-imagebox', 'src');
    const heroImgSrc = await page.getAttribute('img.event-flyer-image', 'src');

    return {flyerImgSrc: flyerImgSrc || heroImgSrc, heroImgSrc};
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
      //   /^(?!https:\/\/entraste\.com\/evento\/kool-memories-centro-uruguayo$).*/,
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
      const {startDate, endDate} = await this.extractDateTimeInfo(page);
      const {flyerImgSrc, heroImgSrc} = await this.extractImageUrls(page);
      const ticketWaves = await this.scrapeTicketWaves(page);

      const eventData: Partial<ScrapedEventData> = {
        externalId: url.split('/').pop() || '',
        platform: Platform.Entraste,
        name,
        description,
        venueName,
        venueAddress,
        eventStartDate: startDate,
        eventEndDate: endDate,
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
        ticketWaves: ticketWaves,
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

  private async scrapeTicketWaves(page: Page): Promise<ScrapedTicketWave[]> {
    try {
      // Execute a function in the browser that targets
      // the book title elements and allows their manipulation
      const ticketWaves = await page.$$eval('.ticket', els => {
        const scrapedTicketWaves: ScrapedTicketWave[] = [];

        els.forEach(ticket => {
          const titleEl = ticket.querySelector('.ticket-description .title');
          let ticketWaveName: string | null = null;

          if (titleEl) {
            // Clone the node to avoid modifying the DOM
            const clone = titleEl.cloneNode(true) as HTMLElement;
            // Remove all <small> elements (e.g., the "Agotadas" part)
            clone.querySelectorAll('small').forEach(small => small.remove());
            // Get the cleaned text content and trim whitespace
            ticketWaveName = clone.textContent?.trim() || '';
          }

          const description =
            ticket.querySelector('.ticket-description .text')?.textContent ??
            '';

          // Get the price from the ticket-price element
          let faceValue = 0;
          let currency: ScrapedTicketWave['currency'] = 'UYU'; // Default to UYU
          const priceContainer = ticket.querySelector('.ticket-price .price');
          if (priceContainer) {
            // Extract the price as a number, removing any non-digit characters
            const priceText =
              priceContainer.textContent
                ?.replace(/[^\d.,]/g, '')
                .replace(',', '.') ?? '';
            faceValue = parseFloat(priceText) || 0;

            // Determine currency from <small> element inside priceContainer
            const smallEl = priceContainer.querySelector('small');
            if (smallEl) {
              const currencyText = smallEl.textContent?.trim() || '';
              if (currencyText === '$') {
                currency = 'UYU';
              } else if (currencyText.length > 0) {
                currency = 'USD';
              }
            }
          }

          const isSoldOut = ticket.classList.contains('tickets-soldout');

          const ticketDataJson = ticket.getAttribute('data-ticket');
          if (ticketDataJson) {
            const ticketDataParsed = JSON.parse(ticketDataJson);

            scrapedTicketWaves.push({
              name: ticketWaveName ?? '',
              description,
              faceValue,
              currency,
              externalId: ticketDataParsed.etid,
              isSoldOut,
              isAvailable: !isSoldOut,
            });
          }
        });

        return scrapedTicketWaves;
      });

      return ticketWaves;
    } catch (error) {
      logger.error('Error scraping ticket waves:', error);
      throw error;
    }
  }
}
