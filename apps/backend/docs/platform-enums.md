# Platform Enums and Types

## Overview

This document defines the platform enums used throughout the system for external event data and ticket scraping.

## Platform Enum Definition

### 1. **Database Enum**

```sql
-- Create the platform enum type
CREATE TYPE platform_type AS ENUM ('entraste', 'passline', 'redtickets');

-- Use in external_event_data table
ALTER TABLE external_event_data 
ALTER COLUMN platform TYPE platform_type 
USING platform::platform_type;
```

### 2. **TypeScript Enum**

```typescript
// Platform enum for type safety
export enum Platform {
  ENTRaste = 'entraste',
  Passline = 'passline',
  RedTickets = 'redtickets'
}

// Platform configuration
export interface PlatformConfig {
  name: Platform;
  baseUrl: string;
  scrapingEnabled: boolean;
  rateLimit: number; // requests per minute
  headers?: Record<string, string>;
}

// Platform configurations
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  [Platform.ENTRaste]: {
    name: Platform.ENTRaste,
    baseUrl: 'https://entraste.com.uy',
    scrapingEnabled: true,
    rateLimit: 30,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TicketBot/1.0)'
    }
  },
  [Platform.Passline]: {
    name: Platform.Passline,
    baseUrl: 'https://passline.com.uy',
    scrapingEnabled: true,
    rateLimit: 25,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TicketBot/1.0)'
    }
  },
  [Platform.RedTickets]: {
    name: Platform.RedTickets,
    baseUrl: 'https://redtickets.com.uy',
    scrapingEnabled: true,
    rateLimit: 20,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TicketBot/1.0)'
    }
  }
};
```

## Database Schema with Enum

### 1. **Updated External Event Data Table**

```typescript
// Kysely schema definition
export interface ExternalEventDataTable {
  id: Generated<string>;
  event_id: string;
  external_id: string;
  platform: Platform; // Using enum instead of string
  external_url: string | null;
  platform_data: JsonValue;
  scraped_at: Generated<Timestamp>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}
```

### 2. **Repository with Type Safety**

```typescript
// External event data repository with enum support
export class ExternalEventDataRepository {
  async findByPlatform(platform: Platform): Promise<ExternalEventData[]> {
    return this.db
      .selectFrom('external_event_data')
      .where('platform', '=', platform)
      .selectAll()
      .execute();
  }

  async findByExternalIdAndPlatform(
    externalId: string, 
    platform: Platform
  ): Promise<ExternalEventData | null> {
    return this.db
      .selectFrom('external_event_data')
      .where('external_id', '=', externalId)
      .where('platform', '=', platform)
      .selectAll()
      .executeTakeFirst();
  }

  async findEventsByPlatform(platform: Platform): Promise<Event[]> {
    return this.db
      .selectFrom('events as e')
      .innerJoin('external_event_data as eed', 'e.id', 'eed.event_id')
      .where('eed.platform', '=', platform)
      .selectAll('e')
      .execute();
  }
}
```

## Scraping Service Implementation

### 1. **Base Scraping Service**

```typescript
// Base scraping service with platform enum
export abstract class BaseScrapingService implements ScrapingService {
  protected platform: Platform;
  protected config: PlatformConfig;

  constructor(platform: Platform) {
    this.platform = platform;
    this.config = PLATFORM_CONFIGS[platform];
  }

  abstract scrapeEvents(): Promise<ScrapedEventData[]>;
  abstract scrapeTicketTypes(eventId: string): Promise<OfficialTicketType[]>;

  getPlatformName(): Platform {
    return this.platform;
  }

  protected async makeRequest(url: string): Promise<string> {
    // Implement rate limiting and headers
    await this.rateLimit();
    
    const response = await fetch(url, {
      headers: this.config.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${this.platform}: ${response.statusText}`);
    }
    
    return response.text();
  }

  private async rateLimit(): Promise<void> {
    // Implement rate limiting logic
    const delay = 60000 / this.config.rateLimit; // Convert to milliseconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 2. **Platform-Specific Implementations**

```typescript
// Entraste scraper
export class EntrasteScraper extends BaseScrapingService {
  constructor() {
    super(Platform.ENTRaste);
  }

  async scrapeEvents(): Promise<ScrapedEventData[]> {
    const events: ScrapedEventData[] = [];
    
    try {
      const html = await this.makeRequest(`${this.config.baseUrl}/eventos`);
      const eventElements = this.parseEventElements(html);
      
      for (const element of eventElements) {
        events.push({
          external_id: element.id,
          platform: this.platform,
          name: element.name,
          description: element.description,
          event_date: element.date,
          event_time: element.time,
          venue_name: element.venue,
          venue_address: element.address,
          city: element.city,
          category: element.category,
          external_url: `${this.config.baseUrl}/evento/${element.id}`,
          platform_data: element.additionalData
        });
      }
    } catch (error) {
      console.error(`Error scraping ${this.platform}:`, error);
    }
    
    return events;
  }

  async scrapeTicketTypes(eventId: string): Promise<OfficialTicketType[]> {
    // Implementation for Entraste ticket types
  }

  private parseEventElements(html: string): any[] {
    // Platform-specific HTML parsing logic
  }
}

// Passline scraper
export class PasslineScraper extends BaseScrapingService {
  constructor() {
    super(Platform.Passline);
  }

  async scrapeEvents(): Promise<ScrapedEventData[]> {
    // Passline-specific implementation
  }

  async scrapeTicketTypes(eventId: string): Promise<OfficialTicketType[]> {
    // Passline-specific implementation
  }
}

// RedTickets scraper
export class RedTicketsScraper extends BaseScrapingService {
  constructor() {
    super(Platform.RedTickets);
  }

  async scrapeEvents(): Promise<ScrapedEventData[]> {
    // RedTickets-specific implementation
  }

  async scrapeTicketTypes(eventId: string): Promise<OfficialTicketType[]> {
    // RedTickets-specific implementation
  }
}
```

## API Usage

### 1. **Platform-Specific Endpoints**

```typescript
// Event controller with platform filtering
export class EventController {
  async getEventsByPlatform(req: Request, res: Response): Promise<void> {
    const platform = req.params.platform as Platform;
    
    // Validate platform enum
    if (!Object.values(Platform).includes(platform)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLATFORM',
          message: `Invalid platform. Must be one of: ${Object.values(Platform).join(', ')}`
        }
      });
      return;
    }
    
    const events = await this.eventService.findEventsByPlatform(platform);
    
    res.json({
      success: true,
      data: events
    });
  }

  async getPlatformStats(req: Request, res: Response): Promise<void> {
    const stats = await this.analyticsService.getPlatformStats();
    
    res.json({
      success: true,
      data: stats
    });
  }
}
```

### 2. **Analytics Service**

```typescript
// Analytics service with platform enum
export class AnalyticsService {
  async getPlatformStats(): Promise<PlatformStats[]> {
    const stats = await this.db
      .selectFrom('external_event_data')
      .select([
        'platform',
        this.db.fn.count('id').as('event_count'),
        this.db.fn.max('scraped_at').as('last_scraped')
      ])
      .groupBy('platform')
      .execute();

    return stats.map(stat => ({
      platform: stat.platform as Platform,
      eventCount: Number(stat.event_count),
      lastScraped: stat.last_scraped
    }));
  }

  async getPlatformHealth(): Promise<PlatformHealth[]> {
    const platforms = Object.values(Platform);
    const health: PlatformHealth[] = [];

    for (const platform of platforms) {
      const config = PLATFORM_CONFIGS[platform];
      const lastScrape = await this.getLastScrapeTime(platform);
      const isHealthy = this.isPlatformHealthy(lastScrape);

      health.push({
        platform,
        enabled: config.scrapingEnabled,
        healthy: isHealthy,
        lastScraped: lastScrape,
        eventCount: await this.getEventCount(platform)
      });
    }

    return health;
  }
}
```

## Benefits of Using Enums

### 1. **Type Safety**
- Compile-time checking for valid platform values
- Prevents typos and invalid platform names
- Better IDE support with autocomplete

### 2. **Database Efficiency**
- Smaller storage footprint
- Better indexing performance
- Constraint enforcement at database level

### 3. **Maintainability**
- Centralized platform definitions
- Easy to add new platforms
- Consistent platform handling across the system

### 4. **API Validation**
- Automatic validation of platform parameters
- Clear error messages for invalid platforms
- Consistent platform naming

This enum-based approach provides better type safety, performance, and maintainability compared to using string literals throughout the system. 