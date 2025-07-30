# Dual Currency Support (USD/UYU)

## Overview

This document outlines the dual currency support system for the ticket reselling platform, supporting both Uruguayan Peso (UYU) and US Dollar (USD) throughout all pricing operations.

## Currency Support Strategy

### 1. **Supported Currencies**
- **UYU (Uruguayan Peso)**: Primary local currency
- **USD (US Dollar)**: International currency for foreign events/tickets

### 2. **Currency Consistency Rules**
- **Event-level consistency**: All ticket waves for an event must use the same currency
- **Ticket-level consistency**: Tickets inherit currency from their wave
- **Listing-level consistency**: Listings must match ticket currency
- **Transaction-level consistency**: Transactions inherit currency from listing

## Database Schema Updates

### 1. **Currency Enum Definition**

```sql
-- Create currency enum
CREATE TYPE currency_type AS ENUM ('USD', 'UYU');

-- Update all price-related tables
ALTER TABLE ticket_waves ALTER COLUMN currency TYPE currency_type;
ALTER TABLE tickets ALTER COLUMN currency TYPE currency_type;
ALTER TABLE listings ALTER COLUMN currency TYPE currency_type;
ALTER TABLE transactions ALTER COLUMN currency TYPE currency_type;
ALTER TABLE pricing_rules ALTER COLUMN currency TYPE currency_type;
```

### 2. **Updated Table Schemas**

```typescript
// TypeScript interfaces with currency support
export interface TicketWaveTable {
  id: Generated<number>;
  event_id: number;
  name: string;
  description: string | null;
  face_value: number;
  currency: 'USD' | 'UYU';
  status: string;
  sale_start: Date | null;
  sale_end: Date | null;
  total_quantity: number | null;
  sold_quantity: number;
  metadata: JsonValue;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TicketTable {
  id: Generated<number>;
  event_id: number;
  ticket_wave_id: number;
  ticket_type: string;
  face_value: number;
  currency: 'USD' | 'UYU';
  code_unique: string;
  status: string;
  is_listed: boolean;
  original_owner_id: number;
  current_owner_id: number;
  metadata: JsonValue;
  barcode_url: string | null;
  created_at: Generated<Date>;
  transferred_at: Date | null;
}

export interface ListingTable {
  id: Generated<number>;
  ticket_id: number;
  seller_id: number;
  price: number;
  currency: 'USD' | 'UYU';
  original_price: number;
  status: string;
  listing_type: string;
  description: string | null;
  terms: JsonValue;
  listed_at: Date;
  expires_at: Date | null;
  sold_at: Date | null;
  views_count: number;
  favorites_count: number;
}

export interface TransactionTable {
  id: Generated<number>;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  final_price: number;
  currency: 'USD' | 'UYU';
  platform_fee: number;
  seller_amount: number;
  payment_status: string;
  payment_method: string;
  payment_gateway: string;
  payment_id: string | null;
  payment_date: Date | null;
  created_at: Generated<Date>;
  completed_at: Date | null;
}
```

## Currency Validation System

### 1. **Currency Validation Service**

```typescript
// Currency validation service
export class CurrencyValidationService {
  private readonly SUPPORTED_CURRENCIES = ['USD', 'UYU'] as const;
  private readonly EXCHANGE_RATES = {
    USD_TO_UYU: 40.5, // Example rate, should be fetched from API
    UYU_TO_USD: 0.0247
  };

  validateCurrency(currency: string): currency is 'USD' | 'UYU' {
    return this.SUPPORTED_CURRENCIES.includes(currency as any);
  }

  validateCurrencyConsistency(
    sourceCurrency: string,
    targetCurrency: string,
    context: string
  ): ValidationResult {
    if (sourceCurrency !== targetCurrency) {
      return {
        isValid: false,
        error: {
          code: 'CURRENCY_MISMATCH',
          message: `Currency mismatch in ${context}: ${sourceCurrency} vs ${targetCurrency}`,
          details: {
            sourceCurrency,
            targetCurrency,
            context
          }
        }
      };
    }

    return { isValid: true };
  }

  async validateEventCurrencyConsistency(eventId: number): Promise<ValidationResult> {
    const waves = await this.ticketWaveRepo.findByEventId(eventId);
    
    if (waves.length === 0) {
      return { isValid: true };
    }

    const firstCurrency = waves[0].currency;
    
    for (const wave of waves) {
      if (wave.currency !== firstCurrency) {
        return {
          isValid: false,
          error: {
            code: 'MIXED_CURRENCIES',
            message: `Event ${eventId} has mixed currencies: ${firstCurrency} and ${wave.currency}`,
            details: {
              eventId,
              expectedCurrency: firstCurrency,
              foundCurrency: wave.currency,
              waveId: wave.id
            }
          }
        };
      }
    }

    return { isValid: true };
  }

  async validateTicketCurrency(ticketId: number, expectedCurrency: string): Promise<ValidationResult> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      return {
        isValid: false,
        error: {
          code: 'TICKET_NOT_FOUND',
          message: `Ticket ${ticketId} not found`
        }
      };
    }

    return this.validateCurrencyConsistency(
      ticket.currency,
      expectedCurrency,
      'ticket'
    );
  }

  async validateListingCurrency(listingId: number, expectedCurrency: string): Promise<ValidationResult> {
    const listing = await this.listingRepo.findById(listingId);
    if (!listing) {
      return {
        isValid: false,
        error: {
          code: 'LISTING_NOT_FOUND',
          message: `Listing ${listingId} not found`
        }
      };
    }

    return this.validateCurrencyConsistency(
      listing.currency,
      expectedCurrency,
      'listing'
    );
  }
}
```

### 2. **Enhanced Price Validation**

```typescript
// Enhanced price validation with currency support
export class PriceValidationService {
  constructor(
    private currencyValidationService: CurrencyValidationService,
    private ticketWaveRepo: TicketWaveRepository,
    private pricingRulesRepo: PricingRulesRepository
  ) {}

  async validateListingPrice(
    ticketId: number,
    price: number,
    currency: 'USD' | 'UYU'
  ): Promise<PriceValidationResult> {
    // Get ticket and validate currency
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Validate currency consistency
    const currencyValidation = this.currencyValidationService.validateCurrencyConsistency(
      ticket.currency,
      currency,
      'listing'
    );

    if (!currencyValidation.isValid) {
      return {
        isValid: false,
        currency: currency,
        faceValue: ticket.face_value,
        faceValueCurrency: ticket.currency,
        violations: [{
          type: 'CURRENCY_MISMATCH',
          message: currencyValidation.error!.message
        }]
      };
    }

    // Get ticket wave for face value
    const wave = await this.ticketWaveRepo.findById(ticket.ticket_wave_id);
    if (!wave) {
      throw new Error('Ticket wave not found');
    }

    // Get pricing rules for the event category
    const event = await this.eventRepo.findById(ticket.event_id);
    const pricingRules = await this.pricingRulesRepo.findByCategoryAndCurrency(
      event.category,
      currency
    );

    // Validate against face value
    const faceValueValidation = this.validateAgainstFaceValue(
      price,
      wave.face_value,
      currency
    );

    // Validate against pricing rules
    const ruleValidation = this.validateAgainstPricingRules(
      price,
      wave.face_value,
      pricingRules,
      currency
    );

    return {
      isValid: faceValueValidation.isValid && ruleValidation.isValid,
      maxAllowedPrice: Math.min(faceValueValidation.maxPrice, ruleValidation.maxPrice),
      faceValue: wave.face_value,
      currency: currency,
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
    rules: PricingRule[],
    currency: string
  ): RuleValidationResult {
    const violations: ValidationViolation[] = [];
    let maxPrice = faceValue;

    for (const rule of rules) {
      // Only apply rules for the same currency
      if (rule.currency !== currency) {
        continue;
      }

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
              message: `Price exceeds maximum allowed price of ${rule.value} ${currency}`
            });
          }
          maxPrice = Math.min(maxPrice, rule.value);
          break;

        case 'min_price':
          if (listingPrice < rule.value) {
            violations.push({
              type: 'BELOW_MIN_PRICE',
              message: `Price below minimum allowed price of ${rule.value} ${currency}`
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

## Currency Conversion (Optional)

### 1. **Exchange Rate Service**

```typescript
// Exchange rate service for optional currency conversion
export class ExchangeRateService {
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/';
  private readonly CACHE_DURATION = 3600000; // 1 hour
  private ratesCache: Map<string, { rate: number; timestamp: number }> = new Map();

  async getExchangeRate(fromCurrency: 'USD' | 'UYU', toCurrency: 'USD' | 'UYU'): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.ratesCache.get(cacheKey);

    // Check if cached rate is still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      // Fetch from external API
      const response = await fetch(`${this.API_URL}${fromCurrency}`);
      const data = await response.json();
      
      const rate = data.rates[toCurrency];
      
      // Cache the rate
      this.ratesCache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Fallback to cached rate or default
      if (cached) {
        return cached.rate;
      }
      
      // Default fallback rates
      const fallbackRates = {
        'USD_UYU': 40.5,
        'UYU_USD': 0.0247
      };
      
      return fallbackRates[cacheKey] || 1;
    }
  }

  async convertPrice(
    amount: number,
    fromCurrency: 'USD' | 'UYU',
    toCurrency: 'USD' | 'UYU'
  ): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  // Get approximate conversion for display purposes
  getApproximateConversion(amount: number, fromCurrency: string, toCurrency: string): string {
    const rates = {
      'USD_UYU': 40.5,
      'UYU_USD': 0.0247
    };

    const rate = rates[`${fromCurrency}_${toCurrency}`];
    if (!rate) {
      return '';
    }

    const converted = amount * rate;
    return `≈ ${converted.toFixed(2)} ${toCurrency}`;
  }
}
```

## Repository Updates

### 1. **Currency-Aware Repositories**

```typescript
// Enhanced ticket wave repository with currency support
export class TicketWaveRepository {
  async findByEventIdAndCurrency(
    eventId: number,
    currency: 'USD' | 'UYU'
  ): Promise<TicketWave[]> {
    return this.db
      .selectFrom('ticket_waves')
      .where('event_id', '=', eventId)
      .where('currency', '=', currency)
      .orderBy('face_value', 'asc')
      .selectAll()
      .execute();
  }

  async validateEventCurrencyConsistency(eventId: number): Promise<boolean> {
    const currencies = await this.db
      .selectFrom('ticket_waves')
      .select('currency')
      .where('event_id', '=', eventId)
      .execute();

    if (currencies.length === 0) {
      return true;
    }

    const uniqueCurrencies = new Set(currencies.map(c => c.currency));
    return uniqueCurrencies.size === 1;
  }
}

// Enhanced listing repository with currency support
export class ListingRepository {
  async findActiveByCurrency(currency: 'USD' | 'UYU'): Promise<Listing[]> {
    return this.db
      .selectFrom('listings')
      .where('currency', '=', currency)
      .where('status', '=', 'active')
      .orderBy('price', 'asc')
      .selectAll()
      .execute();
  }

  async findListingsInPriceRange(
    minPrice: number,
    maxPrice: number,
    currency: 'USD' | 'UYU'
  ): Promise<Listing[]> {
    return this.db
      .selectFrom('listings')
      .where('currency', '=', currency)
      .where('price', '>=', minPrice)
      .where('price', '<=', maxPrice)
      .where('status', '=', 'active')
      .orderBy('price', 'asc')
      .selectAll()
      .execute();
  }
}
```

## API Endpoints

### 1. **Currency-Aware Endpoints**

```typescript
// Enhanced event controller with currency support
export class EventController {
  async getEventWaves(req: Request, res: Response): Promise<void> {
    const eventId = parseInt(req.params.eventId);
    const currency = req.query.currency as 'USD' | 'UYU';
    
    if (currency && !['USD', 'UYU'].includes(currency)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: 'Currency must be USD or UYU'
        }
      });
      return;
    }

    const waves = currency 
      ? await this.ticketWaveService.getWavesByCurrency(eventId, currency)
      : await this.ticketWaveService.getWavesForEvent(eventId);
    
    res.json({
      success: true,
      data: waves
    });
  }

  async getListingsByCurrency(req: Request, res: Response): Promise<void> {
    const currency = req.params.currency as 'USD' | 'UYU';
    
    if (!['USD', 'UYU'].includes(currency)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: 'Currency must be USD or UYU'
        }
      });
      return;
    }

    const listings = await this.listingService.getActiveByCurrency(currency);
    
    res.json({
      success: true,
      data: listings
    });
  }

  async getExchangeRate(req: Request, res: Response): Promise<void> {
    const { from, to } = req.query;
    
    if (!['USD', 'UYU'].includes(from as string) || !['USD', 'UYU'].includes(to as string)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: 'Both from and to currencies must be USD or UYU'
        }
      });
      return;
    }

    const rate = await this.exchangeRateService.getExchangeRate(
      from as 'USD' | 'UYU',
      to as 'USD' | 'UYU'
    );
    
    res.json({
      success: true,
      data: {
        from,
        to,
        rate,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

## Business Logic Examples

### 1. **Creating a Listing with Currency Validation**

```typescript
// Enhanced listing service
export class ListingService {
  async createListing(createListingDto: CreateListingDto): Promise<Listing> {
    const { ticket_id, price, currency } = createListingDto;

    // Get ticket and validate currency
    const ticket = await this.ticketRepo.findById(ticket_id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Validate currency consistency
    if (ticket.currency !== currency) {
      throw new ValidationError({
        code: 'CURRENCY_MISMATCH',
        message: `Ticket currency (${ticket.currency}) does not match listing currency (${currency})`
      });
    }

    // Validate price
    const validation = await this.priceValidationService.validateListingPrice(
      ticket_id,
      price,
      currency
    );

    if (!validation.isValid) {
      throw new ValidationError({
        code: 'INVALID_LISTING_PRICE',
        message: 'Listing price validation failed',
        details: validation.violations
      });
    }

    // Create listing
    const listing = await this.listingRepo.create({
      ...createListingDto,
      original_price: price,
      status: 'active',
      listed_at: new Date()
    });

    return listing;
  }
}
```

### 2. **Processing Transactions with Currency**

```typescript
// Enhanced transaction service
export class TransactionService {
  async processTransaction(transactionDto: CreateTransactionDto): Promise<Transaction> {
    const { listing_id, buyer_id, payment_method } = transactionDto;

    // Get listing and validate
    const listing = await this.listingRepo.findById(listing_id);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not available');
    }

    // Calculate fees based on currency
    const fees = await this.calculatePlatformFees(
      listing.price,
      listing.currency
    );

    // Create transaction
    const transaction = await this.transactionRepo.create({
      listing_id,
      buyer_id,
      seller_id: listing.seller_id,
      final_price: listing.price,
      currency: listing.currency,
      platform_fee: fees.platformFee,
      seller_amount: listing.price - fees.platformFee,
      payment_status: 'initiated',
      payment_method,
      created_at: new Date()
    });

    return transaction;
  }

  private async calculatePlatformFees(
    amount: number,
    currency: 'USD' | 'UYU'
  ): Promise<{ platformFee: number; processingFee: number }> {
    // Different fee structures for different currencies
    const feeRates = {
      USD: { platform: 0.05, processing: 0.029 }, // 5% platform + 2.9% processing
      UYU: { platform: 0.05, processing: 0.035 }  // 5% platform + 3.5% processing
    };

    const rates = feeRates[currency];
    const platformFee = amount * rates.platform;
    const processingFee = amount * rates.processing;

    return { platformFee, processingFee };
  }
}
```

## Benefits of Dual Currency Support

### 1. **Market Flexibility**
- **Local events**: Support UYU for Uruguayan events
- **International events**: Support USD for foreign artists/events
- **User preference**: Users can choose their preferred currency

### 2. **Regulatory Compliance**
- **Local pricing**: UYU for local regulatory compliance
- **International standards**: USD for international events
- **Tax reporting**: Proper currency tracking for tax purposes

### 3. **User Experience**
- **Familiar pricing**: Users see prices in familiar currency
- **No conversion confusion**: No need for real-time conversion
- **Clear pricing**: Transparent pricing in original currency

### 4. **Business Operations**
- **Platform fees**: Different fee structures per currency
- **Payment processing**: Currency-specific payment gateways
- **Financial reporting**: Separate reporting by currency

This dual currency system provides the flexibility needed for a Uruguayan ticket platform while maintaining data integrity and user experience. 