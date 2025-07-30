# Enhanced Database Schema

## Overview

This document presents an enhanced database schema that addresses additional considerations for a production-ready ticket reselling platform.

## Enhanced Schema

```mermaid
erDiagram
    USERS {
      SERIAL id PK
      VARCHAR name
      VARCHAR email UNIQUE
      VARCHAR phone
      VARCHAR role
      VARCHAR status
      BOOLEAN email_verified
      BOOLEAN phone_verified
      VARCHAR avatar_url
      JSONB preferences
      TIMESTAMPTZ created_at
      TIMESTAMPTZ updated_at
      TIMESTAMPTZ last_login_at
    }

    USER_VERIFICATIONS {
      SERIAL id PK
      INT user_id FK
      VARCHAR document_type
      VARCHAR document_url
      VARCHAR status
      TEXT rejection_reason
      TIMESTAMPTZ submitted_at
      TIMESTAMPTZ reviewed_at
      INT reviewed_by FK
    }

    EVENTS {
      SERIAL id PK
      VARCHAR name
      TEXT description
      DATE event_date
      TIME event_time
      VARCHAR location
      VARCHAR venue_name
      VARCHAR city
      VARCHAR country
      VARCHAR postal_code
      DECIMAL latitude
      DECIMAL longitude
      INT organizer_id FK
      VARCHAR status
      VARCHAR category
      JSONB metadata
      VARCHAR image_url
      TIMESTAMPTZ created_at
      TIMESTAMPTZ updated_at
    }

    TICKET_WAVES {
      SERIAL id PK
      INT event_id FK
      VARCHAR name
      TEXT description
      NUMERIC face_value
      VARCHAR currency
      VARCHAR status
      TIMESTAMPTZ sale_start
      TIMESTAMPTZ sale_end
      INT total_quantity
      INT sold_quantity
      JSONB metadata
      TIMESTAMPTZ created_at
      TIMESTAMPTZ updated_at
    }

    TICKETS {
      SERIAL id PK
      INT event_id FK
      INT ticket_wave_id FK
      VARCHAR ticket_type
      NUMERIC face_value
      VARCHAR currency
      VARCHAR code_unique UNIQUE
      VARCHAR status
      BOOLEAN is_listed
      INT original_owner_id FK
      INT current_owner_id FK
      JSONB metadata
      VARCHAR barcode_url
      TIMESTAMPTZ created_at
      TIMESTAMPTZ transferred_at
    }

    LISTINGS {
      SERIAL id PK
      INT ticket_id FK
      INT seller_id FK
      NUMERIC price
      VARCHAR currency
      NUMERIC original_price
      VARCHAR status
      VARCHAR listing_type
      TEXT description
      JSONB terms
      TIMESTAMPTZ listed_at
      TIMESTAMPTZ expires_at
      TIMESTAMPTZ sold_at
      INT views_count
      INT favorites_count
    }

    TRANSACTIONS {
      SERIAL id PK
      INT listing_id FK
      INT buyer_id FK
      INT seller_id FK
      NUMERIC final_price
      VARCHAR currency
      NUMERIC platform_fee
      NUMERIC seller_amount
      VARCHAR payment_status
      VARCHAR payment_method
      VARCHAR payment_gateway
      VARCHAR payment_id
      TIMESTAMPTZ payment_date
      TIMESTAMPTZ created_at
      TIMESTAMPTZ completed_at
    }

    DISPUTES {
      SERIAL id PK
      INT transaction_id FK
      INT initiator_id FK
      VARCHAR reason
      TEXT description
      VARCHAR status
      VARCHAR resolution
      NUMERIC refund_amount
      INT assigned_admin FK
      TIMESTAMPTZ created_at
      TIMESTAMPTZ resolved_at
    }

    MESSAGES {
      SERIAL id PK
      INT transaction_id FK
      INT sender_id FK
      INT receiver_id FK
      TEXT content
      VARCHAR message_type
      BOOLEAN is_read
      TIMESTAMPTZ sent_at
      TIMESTAMPTZ read_at
    }

    NOTIFICATIONS {
      SERIAL id PK
      INT user_id FK
      VARCHAR type
      VARCHAR title
      TEXT message
      JSONB data
      BOOLEAN is_read
      VARCHAR channel
      TIMESTAMPTZ created_at
      TIMESTAMPTZ sent_at
      TIMESTAMPTZ read_at
    }

    AUDIT_LOGS {
      SERIAL id PK
      VARCHAR table_name
      VARCHAR action
      INT record_id
      JSONB old_values
      JSONB new_values
      INT user_id FK
      INET ip_address
      VARCHAR user_agent
      TIMESTAMPTZ created_at
    }

    PRICING_RULES {
      SERIAL id PK
      VARCHAR rule_type
      VARCHAR event_category
      NUMERIC value
      VARCHAR currency
      BOOLEAN is_active
      TIMESTAMPTZ created_at
      TIMESTAMPTZ updated_at
    }

    USERS ||--o{ USER_VERIFICATIONS : "has"
    USERS ||--o{ EVENTS : "organizes"
    USERS ||--o{ TICKETS : "owns"
    USERS ||--o{ LISTINGS : "creates"
    USERS ||--o{ TRANSACTIONS : "participates"
    USERS ||--o{ DISPUTES : "initiates"
    USERS ||--o{ MESSAGES : "sends/receives"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    
    EVENTS ||--o{ TICKET_WAVES : "has"
    EVENTS ||--o{ TICKETS : "has"
    TICKET_WAVES ||--o{ TICKETS : "defines"
    TICKETS ||--o{ LISTINGS : "listed as"
    LISTINGS ||--|{ TRANSACTIONS : "sold via"
    TRANSACTIONS ||--o{ DISPUTES : "disputed"
    TRANSACTIONS ||--o{ MESSAGES : "threads"
```

## Field Descriptions

### USERS Table
- **role**: ENUM: user, organizer, admin
- **status**: ENUM: active, suspended, banned, pending_verification
- **preferences**: User preferences and settings stored as JSON

### USER_VERIFICATIONS Table
- **document_type**: ENUM: id_card, passport, driving_license
- **status**: ENUM: pending, approved, rejected
- **user_id FK**: → USERS.id
- **reviewed_by FK**: → USERS.id

### EVENTS Table
- **status**: ENUM: draft, published, cancelled, completed
- **category**: ENUM: concert, sports, theater, festival, etc.
- **organizer_id FK**: → USERS.id
- **metadata**: Event-specific data stored as JSON

### TICKET_WAVES Table
- **name**: e.g., 'General Admission', 'VIP', 'Early Bird'
- **currency**: ENUM: USD, UYU
- **status**: ENUM: active, sold_out, expired, cancelled
- **event_id FK**: → EVENTS.id
- **metadata**: Platform-specific data (wave_id, etc.)

### TICKETS Table
- **ticket_wave_id FK**: → TICKET_WAVES.id
- **currency**: ENUM: USD, UYU - matches ticket_wave.currency
- **status**: ENUM: valid, used, expired, cancelled
- **event_id FK**: → EVENTS.id
- **original_owner_id FK**: → USERS.id
- **current_owner_id FK**: → USERS.id
- **metadata**: Extra fields (seat, section, row, etc.)

### LISTINGS Table
- **currency**: ENUM: USD, UYU - must match ticket currency
- **status**: ENUM: active, pending, sold, cancelled, expired
- **listing_type**: ENUM: fixed_price, auction, best_offer
- **ticket_id FK**: → TICKETS.id
- **seller_id FK**: → USERS.id
- **terms**: Seller terms and conditions stored as JSON

### TRANSACTIONS Table
- **currency**: ENUM: USD, UYU - must match listing currency
- **payment_status**: ENUM: initiated, pending, paid, refunded, disputed, completed, failed
- **payment_method**: ENUM: credit_card, bank_transfer, digital_wallet
- **listing_id FK**: → LISTINGS.id
- **buyer_id FK**: → USERS.id
- **seller_id FK**: → USERS.id

### DISPUTES Table
- **reason**: ENUM: ticket_invalid, not_received, wrong_ticket, other
- **status**: ENUM: open, under_review, resolved, closed
- **resolution**: ENUM: refund_buyer, refund_seller, partial_refund, no_action
- **transaction_id FK**: → TRANSACTIONS.id
- **initiator_id FK**: → USERS.id
- **assigned_admin FK**: → USERS.id

### MESSAGES Table
- **message_type**: ENUM: text, image, file, system
- **transaction_id FK**: → TRANSACTIONS.id
- **sender_id FK**: → USERS.id
- **receiver_id FK**: → USERS.id

### NOTIFICATIONS Table
- **type**: ENUM: listing_sold, payment_received, dispute_opened, etc.
- **channel**: ENUM: email, sms, push, in_app
- **user_id FK**: → USERS.id
- **data**: Additional notification data stored as JSON

### AUDIT_LOGS Table
- **action**: ENUM: INSERT, UPDATE, DELETE
- **user_id FK**: → USERS.id

### PRICING_RULES Table
- **rule_type**: ENUM: max_markup, min_price, max_price
- **currency**: ENUM: USD, UYU
