# Ticket Waves and Price Validation

## Overview

This document explains the ticket waves system and how it's used to validate ticket prices in the peer-to-peer reselling platform. Ticket waves represent different categories or phases of ticket sales with specific face values that serve as the maximum allowed resale price.

## Ticket Waves Structure

### 1. **What are Ticket Waves?**

Ticket waves are different categories or phases of ticket sales for an event, each with:
- **Unique name** (e.g., "General Admission", "VIP", "Early Bird")
- **Face value** (original ticket price)
- **Sale period** (start and end dates)
- **Quantity limits** (total and sold quantities)
- **Status tracking** (active, sold out, expired, cancelled)

### 2. **Database Schema**

```sql
CREATE TABLE ticket_waves (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  face_value NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UYU',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold_out', 'expired', 'cancelled')),
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  total_quantity INT,
  sold_quantity INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **Example Ticket Waves**

```json
{
  "event_id": 123,
  "waves": [
    {
      "name": "Early Bird General",
      "description": "Limited early access tickets",
      "face_value": 1500.00,
      "currency": "UYU",
      "sale_start": "2024-01-15T10:00:00Z",
      "sale_end": "2024-01-20T23:59:59Z",
      "total_quantity": 500,
      "sold_quantity": 450
    },
    {
      "name": "General Admission",
      "description": "Standard admission tickets",
      "face_value": 2000.00,
      "currency": "UYU",
      "sale_start": "2024-01-21T10:00:00Z",
      "sale_end": "2024-02-15T23:59:59Z",
      "total_quantity": 2000,
      "sold_quantity": 1200
    },
    {
      "name": "VIP Experience",
      "description": "Premium seating with exclusive benefits",
      "face_value": 5000.00,
      "currency": "UYU",
      "sale_start": "2024-01-15T10:00:00Z",
      "sale_end": "2024-02-15T23:59:59Z",
      "total_quantity": 100,
      "sold_quantity": 75
    }
  ]
}
```

## Scraping and Data Collection

### 1. **Scraping Ticket Waves**

```typescript
// Interface for scraped ticket wave data
export interface ScrapedTicketWave {
  external_wave_id: string;
  name: string;
  description?: string;
  face_value: number;
  currency: string;
  sale_start?: Date;
  sale_end?: Date;
  total_quantity?: number;
  sold_quantity?: number;
  platform_data: Record<string, any>;
}

// Updated scraping service interface
export interface ScrapingService {
  scrapeEvents(): Promise<ScrapedEventData[]>;
  scrapeTicketWaves(eventId: string): Promise<ScrapedTicketWave[]>;
  getPlatformName(): Platform;
}
```

### 2. **Platform-Specific Scraping**

```typescript
// Entraste scraper implementation
export class EntrasteScraper extends BaseScrapingService {
  async scrapeTicketWaves(eventId: string): Promise<ScrapedTicketWave[]> {
    const waves: ScrapedTicketWave[] = [];
    
    try {
      // Fetch ticket waves from Entraste
      const url = `${this.config.baseUrl}/evento/${eventId}/entradas`;
      const html = await this.makeRequest(url);
      
      // Parse HTML to extract wave information
      const waveElements = this.parseWaveElements(html);
      
      for (const element of waveElements) {
        waves.push({
          external_wave_id: element.id,
          name: element.name,
          description: element.description,
          face_value: element.price,
          currency: 'UYU',
          sale_start: element.saleStart,
          sale_end: element.saleEnd,
          total_quantity: element.totalQuantity,
          sold_quantity: element.soldQuantity,
          platform_data: {
            wave_id: element.id,
            category: element.category,
            benefits: element.benefits
          }
        });
      }
    } catch (error) {
      console.error(`Error scraping ticket waves for event ${eventId}:`, error);
    }
    
    return waves;
  }

  private parseWaveElements(html: string): any[] {
    // Platform-specific HTML parsing logic
    // Extract wave information from Entraste's HTML structure
  }
}
```

### 3. **Data Processing Pipeline**

```typescript
// Ticket wave data processor
export class TicketWaveProcessor {
  constructor(
    private ticketWaveRepo: TicketWaveRepository,
    private eventRepo: EventRepository
  ) {}

  async processScrapedWaves(
    eventId: string,
    platform: Platform,
    waves: ScrapedTicketWave[]
  ): Promise<void> {
    // Find or create event
    const event = await this.eventRepo.findByExternalId(eventId, platform);
    if (!event) {
      console.warn(`Event not found for external ID: ${eventId}`);
      return;
    }

    // Process each wave
    for (const wave of waves) {
      await this.processWave(event.id, platform, wave);
    }
  }

  private async processWave(
    eventId: number,
    platform: Platform,
    wave: ScrapedTicketWave
  ): Promise<void> {
    // Check if wave already exists
    const existingWave = await this.ticketWaveRepo.findByExternalId(
      wave.external_wave_id,
      platform
    );

    if (existingWave) {
      // Update existing wave
      await this.ticketWaveRepo.update(existingWave.id, {
        name: wave.name,
        description: wave.description,
        face_value: wave.face_value,
        currency: wave.currency,
        sale_start: wave.sale_start,
        sale_end: wave.sale_end,
        total_quantity: wave.total_quantity,
        sold_quantity: wave.sold_quantity,
        metadata: {
          ...existingWave.metadata,
          [platform]: wave.platform_data
        },
        updated_at: new Date()
      });
    } else {
      // Create new wave
      await this.ticketWaveRepo.create({
        event_id: eventId,
        name: wave.name,
        description: wave.description,
        face_value: wave.face_value,
        currency: wave.currency,
        sale_start: wave.sale_start,
        sale_end: wave.sale_end,
        total_quantity: wave.total_quantity,
        sold_quantity: wave.sold_quantity,
        status: this.determineWaveStatus(wave),
        metadata: {
          external_wave_id: wave.external_wave_id,
          platform: platform,
          [platform]: wave.platform_data
        }
      });
    }
  }

  private determineWaveStatus(wave: ScrapedTicketWave): string {
    const now = new Date();
    
    if (wave.sale_end && now > wave.sale_end) {
      return 'expired';
    }
    
    if (wave.total_quantity && wave.sold_quantity && 
        wave.sold_quantity >= wave.total_quantity) {
      return 'sold_out';
    }
    
    return 'active';
  }
}
```

## Price Validation System

### 1. **Price Validation Logic**

```typescript
// Price validation service
export class PriceValidationService {
  constructor(
    private ticketWaveRepo: TicketWaveRepository,
    private pricingRulesRepo: PricingRulesRepository
  ) {}

  async validateListingPrice(
    ticketId: number,
    listingPrice: number
  ): Promise<PriceValidationResult> {
    // Get ticket and its wave
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const wave = await this.ticketWaveRepo.findById(ticket.ticket_wave_id);
    if (!wave) {
      throw new Error('Ticket wave not found');
    }

    // Get pricing rules for the event category
    const event = await this.eventRepo.findById(ticket.event_id);
    const pricingRules = await this.pricingRulesRepo.findByCategory(event.category);

    // Validate against face value
    const faceValueValidation = this.validateAgainstFaceValue(
      listingPrice,
      wave.face_value,
      wave.currency
    );

    // Validate against pricing rules
    const ruleValidation = this.validateAgainstPricingRules(
      listingPrice,
      wave.face_value,
      pricingRules
    );

    return {
      isValid: faceValueValidation.isValid && ruleValidation.isValid,
      maxAllowedPrice: Math.min(faceValueValidation.maxPrice, ruleValidation.maxPrice),
      faceValue: wave.face_value,
      currency: wave.currency,
      violations: [...faceValueValidation.violations, ...ruleValidation.violations]
    };
  }

  private validateAgainstFaceValue(
    listingPrice: number,
    faceValue: number,
    currency: string
  ): FaceValueValidationResult {
    const isValid = listingPrice <= faceValue;
    
    return {
      isValid,
      maxPrice: faceValue,
      violations: isValid ? [] : [{
        type: 'EXCEEDS_FACE_VALUE',
        message: `Listing price (${listingPrice} ${currency}) exceeds face value (${faceValue} ${currency})`
      }]
    };
  }

  private validateAgainstPricingRules(
    listingPrice: number,
    faceValue: number,
    rules: PricingRule[]
  ): RuleValidationResult {
    const violations: ValidationViolation[] = [];
    let maxPrice = faceValue;

    for (const rule of rules) {
      switch (rule.rule_type) {
        case 'max_markup':
          const maxMarkupPrice = faceValue * (1 + rule.value / 100);
          if (listingPrice > maxMarkupPrice) {
            violations.push({
              type: 'EXCEEDS_MAX_MARKUP',
              message: `Price exceeds maximum markup of ${rule.value}%`
            });
          }
          maxPrice = Math.min(maxPrice, maxMarkupPrice);
          break;

        case 'max_price':
          if (listingPrice > rule.value) {
            violations.push({
              type: 'EXCEEDS_MAX_PRICE',
              message: `Price exceeds maximum allowed price of ${rule.value}`
            });
          }
          maxPrice = Math.min(maxPrice, rule.value);
          break;

        case 'min_price':
          if (listingPrice < rule.value) {
            violations.push({
              type: 'BELOW_MIN_PRICE',
              message: `Price below minimum allowed price of ${rule.value}`
            });
          }
          break;
      }
    }

    return {
      isValid: violations.length === 0,
      maxPrice,
      violations
    };
  }
}
```

### 2. **Listing Creation with Validation**

```typescript
// Enhanced listing service with price validation
export class ListingService {
  constructor(
    private priceValidationService: PriceValidationService,
    private listingRepo: ListingRepository,
    private notificationService: NotificationService
  ) {}

  async createListing(createListingDto: CreateListingDto): Promise<Listing> {
    // Validate price before creating listing
    const validation = await this.priceValidationService.validateListingPrice(
      createListingDto.ticket_id,
      createListingDto.price
    );

    if (!validation.isValid) {
      throw new ValidationError({
        code: 'INVALID_LISTING_PRICE',
        message: 'Listing price validation failed',
        details: validation.violations
      });
    }

    // Create the listing
    const listing = await this.listingRepo.create({
      ...createListingDto,
      original_price: createListingDto.price,
      status: 'active',
      listed_at: new Date()
    });

    // Notify user about successful listing
    await this.notificationService.notifyListingCreated(listing);

    return listing;
  }

  async updateListingPrice(
    listingId: number,
    newPrice: number
  ): Promise<Listing> {
    const listing = await this.listingRepo.findById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Validate new price
    const validation = await this.priceValidationService.validateListingPrice(
      listing.ticket_id,
      newPrice
    );

    if (!validation.isValid) {
      throw new ValidationError({
        code: 'INVALID_LISTING_PRICE',
        message: 'New price validation failed',
        details: validation.violations
      });
    }

    // Update listing
    return await this.listingRepo.update(listingId, {
      price: newPrice,
      updated_at: new Date()
    });
  }
}
```

## Repository Implementation

### 1. **Ticket Wave Repository**

```typescript
// Ticket wave repository
export class TicketWaveRepository {
  constructor(private db: Database) {}

  async create(wave: CreateTicketWaveDto): Promise<TicketWave> {
    return this.db
      .insertInto('ticket_waves')
      .values(wave)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findById(id: number): Promise<TicketWave | null> {
    return this.db
      .selectFrom('ticket_waves')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  }

  async findByEventId(eventId: number): Promise<TicketWave[]> {
    return this.db
      .selectFrom('ticket_waves')
      .where('event_id', '=', eventId)
      .orderBy('face_value', 'asc')
      .selectAll()
      .execute();
  }

  async findByExternalId(
    externalId: string,
    platform: Platform
  ): Promise<TicketWave | null> {
    return this.db
      .selectFrom('ticket_waves')
      .where('metadata->>external_wave_id', '=', externalId)
      .where('metadata->>platform', '=', platform)
      .selectAll()
      .executeTakeFirst();
  }

  async update(id: number, updates: Partial<TicketWave>): Promise<TicketWave> {
    return this.db
      .updateTable('ticket_waves')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getActiveWavesForEvent(eventId: number): Promise<TicketWave[]> {
    return this.db
      .selectFrom('ticket_waves')
      .where('event_id', '=', eventId)
      .where('status', '=', 'active')
      .orderBy('face_value', 'asc')
      .selectAll()
      .execute();
  }

  async getWaveStats(eventId: number): Promise<WaveStats[]> {
    return this.db
      .selectFrom('ticket_waves')
      .select([
        'name',
        'face_value',
        'currency',
        'status',
        'total_quantity',
        'sold_quantity',
        this.db.fn.coalesce('total_quantity', 0).as('total'),
        this.db.fn.coalesce('sold_quantity', 0).as('sold')
      ])
      .where('event_id', '=', eventId)
      .execute();
  }
}
```

## API Endpoints

### 1. **Ticket Wave Endpoints**

```typescript
// Ticket wave controller
export class TicketWaveController {
  constructor(
    private ticketWaveService: TicketWaveService,
    private eventService: EventService
  ) {}

  // Get waves for an event
  async getEventWaves(req: Request, res: Response): Promise<void> {
    const eventId = parseInt(req.params.eventId);
    
    const waves = await this.ticketWaveService.getWavesForEvent(eventId);
    
    res.json({
      success: true,
      data: waves
    });
  }

  // Get wave statistics
  async getWaveStats(req: Request, res: Response): Promise<void> {
    const eventId = parseInt(req.params.eventId);
    
    const stats = await this.ticketWaveService.getWaveStats(eventId);
    
    res.json({
      success: true,
      data: stats
    });
  }

  // Validate listing price
  async validateListingPrice(req: Request, res: Response): Promise<void> {
    const { ticket_id, price } = req.body;
    
    const validation = await this.ticketWaveService.validatePrice(ticket_id, price);
    
    res.json({
      success: true,
      data: validation
    });
  }
}
```

## Benefits of Ticket Waves System

### 1. **Accurate Price Validation**
- **Face value tracking**: Each ticket wave has its exact original price
- **Real-time validation**: Prices are validated against current wave data
- **Platform-specific data**: Maintains original platform information

### 2. **Flexible Pricing Structure**
- **Multiple categories**: Support for different ticket types and prices
- **Sale periods**: Track when different waves are available
- **Quantity management**: Monitor availability and sales progress

### 3. **Compliance and Trust**
- **Price transparency**: Users can see original ticket prices
- **Regulatory compliance**: Enforce maximum resale prices
- **Audit trail**: Complete history of price validation decisions

### 4. **User Experience**
- **Clear pricing**: Users understand what they're buying
- **Fair marketplace**: Prevents price gouging
- **Confidence**: Buyers know they're not overpaying

This ticket waves system provides a robust foundation for price validation while maintaining flexibility for different event types and pricing structures. 