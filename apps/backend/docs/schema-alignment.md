# Database Schema Alignment with TypeScript Types

This document shows how our database schema aligns with our scraping data types.

## TypeScript Types

### ScrapedEventData

```typescript
export const ScrapedEventDataSchema = z.object({
  externalId: z.string(), // → events.external_id
  platform: z.enum(Platform), // → events.platform
  name: z.string(), // → events.name
  description: z.string().optional(), // → events.description
  eventStartDate: z.date(), // → events.event_start_date
  eventEndDate: z.date(), // → events.event_end_date
  venueName: z.string().optional(), // → events.venue_name
  venueAddress: z.string(), // → events.venue_address
  externalUrl: z.url(), // → events.external_url
  images: z.array(
    // → event_images table
    z.object({
      type: z.enum(ScrapedImageType), // → event_images.image_type
      url: z.url(), // → event_images.url
    }),
  ),
});
```

### ScrapedTicketWave

```typescript
export const ScrapedTicketWaveSchema = z.object({
  externalId: z.string(), // → event_ticket_waves.external_id
  name: z.string(), // → event_ticket_waves.name
  description: z.string().optional(), // → event_ticket_waves.description
  faceValue: z.number(), // → event_ticket_waves.face_value
  currency: z.string(), // → event_ticket_waves.currency
  isSoldOut: z.boolean(), // → event_ticket_waves.is_sold_out
  isAvailable: z.boolean(), // → event_ticket_waves.is_available
});
```

## Database Schema

### EVENTS Table

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,    -- ScrapedEventData.externalId
  platform VARCHAR(50) NOT NULL,               -- ScrapedEventData.platform
  name VARCHAR(500) NOT NULL,                  -- ScrapedEventData.name
  description TEXT,                             -- ScrapedEventData.description
  event_start_date TIMESTAMPTZ NOT NULL,       -- ScrapedEventData.eventStartDate
  event_end_date TIMESTAMPTZ NOT NULL,         -- ScrapedEventData.eventEndDate
  venue_name VARCHAR(255),                     -- ScrapedEventData.venueName
  venue_address TEXT NOT NULL,                 -- ScrapedEventData.venueAddress
  external_url VARCHAR(1000) NOT NULL,         -- ScrapedEventData.externalUrl
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  metadata JSONB,                              -- Additional platform-specific data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_scraped_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### EVENT_IMAGES Table

```sql
CREATE TABLE event_images (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  image_type VARCHAR(50) NOT NULL,             -- ScrapedEventData.images[].type
  url VARCHAR(1000) NOT NULL,                  -- ScrapedEventData.images[].url
  alt_text VARCHAR(500),                       -- Accessibility
  display_order INTEGER DEFAULT 0 NOT NULL,    -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### EVENT_TICKET_WAVES Table

```sql
CREATE TABLE event_ticket_waves (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  external_id VARCHAR(255) UNIQUE NOT NULL,    -- ScrapedTicketWave.externalId
  name VARCHAR(255) NOT NULL,                  -- ScrapedTicketWave.name
  description TEXT,                             -- ScrapedTicketWave.description
  face_value NUMERIC NOT NULL,                 -- ScrapedTicketWave.faceValue
  currency VARCHAR(3) NOT NULL,                -- ScrapedTicketWave.currency
  is_sold_out BOOLEAN DEFAULT FALSE NOT NULL, -- ScrapedTicketWave.isSoldOut
  is_available BOOLEAN DEFAULT TRUE NOT NULL, -- ScrapedTicketWave.isAvailable
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  metadata JSONB,                              -- Additional platform-specific data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_scraped_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Key Benefits of This Schema

### 1. **Direct Type Mapping**

- Every field in `ScrapedEventData` has a corresponding database column
- Every field in `ScrapedTicketWave` has a corresponding database column
- No data transformation needed when storing scraped data

### 2. **Multiple Images Support**

- `EVENT_IMAGES` table allows multiple images per event
- Supports both `flyer` and `hero` image types
- `display_order` for controlling image presentation

### 3. **Platform Agnostic**

- `platform` field identifies the source (Entraste, Passline, RedTickets)
- `external_id` ensures uniqueness across platforms
- `metadata` JSONB field for platform-specific data

### 4. **Scraping Metadata**

- `last_scraped_at` tracks when data was last updated
- `created_at` and `updated_at` for audit trails
- `status` field for event lifecycle management

### 5. **Performance Optimized**

- Indexes on `external_id` for fast lookups
- Indexes on `platform` for filtering
- Foreign key constraints for data integrity

## Data Flow

```
Scraped Data → Type Validation → Database Storage
     ↓              ↓              ↓
ScrapedEventData → Zod Schema → EVENTS + EVENT_IMAGES
ScrapedTicketWave → Zod Schema → EVENT_TICKET_WAVES
```

## Usage Examples

### Storing Scraped Event

```typescript
// After successful scraping
const eventData: ScrapedEventData = {
  externalId: 'entraste-event-123',
  platform: Platform.Entraste,
  name: 'Summer Concert',
  // ... other fields
};

// Store in database
await db.insertInto('events').values({
  external_id: eventData.externalId,
  platform: eventData.platform,
  name: eventData.name,
  // ... map other fields
});

// Store images
for (const image of eventData.images) {
  await db.insertInto('event_images').values({
    event_id: eventId,
    image_type: image.type,
    url: image.url,
  });
}
```

### Storing Scraped Ticket Wave

```typescript
const ticketWave: ScrapedTicketWave = {
  externalId: 'entraste-wave-456',
  name: 'General Admission',
  faceValue: 50.0,
  currency: 'USD',
  isSoldOut: false,
  isAvailable: true,
};

await db.insertInto('event_ticket_waves').values({
  event_id: eventId,
  external_id: ticketWave.externalId,
  name: ticketWave.name,
  face_value: ticketWave.faceValue,
  currency: ticketWave.currency,
  is_sold_out: ticketWave.isSoldOut,
  is_available: ticketWave.isAvailable,
});
```

## Migration

Run the migration to create these tables:

```bash
pnpm kysely:migrate
```

This will create the `events`, `event_images`, and `event_ticket_waves` tables with proper relationships and indexes.
