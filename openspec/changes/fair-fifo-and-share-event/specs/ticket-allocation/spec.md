# Specification: Fair FIFO Ticket Allocation

## Overview

When multiple sellers list tickets at identical prices within a price group, the system MUST prioritize tickets based on when they were first set to that price, not when the listing was originally created. This ensures fairness: sellers who commit to a lower price earlier deserve priority over those who listed at higher prices and later reduced them.

## Requirements

### Ordering Criteria

**REQ-1**: The ticket allocation system SHALL order available tickets by `updatedAt ASC` instead of `createdAt ASC`.

**REQ-2**: The `updatedAt` timestamp MUST reflect when a ticket was last modified. Since price is the only user-mutable field on listing tickets, `updatedAt` effectively means "when this ticket was set to its current price."

**REQ-3**: For tickets that have never been updated, `updatedAt` SHALL equal `createdAt`, maintaining identical behavior to the current system for unmodified listings.

### Affected Methods

**REQ-4**: The following repository methods in `ListingTicketsRepository` MUST use `updatedAt` ordering:
- `findAvailableTicketsByPriceGroup()`
- `findAvailableTicketsByPriceGroupForUpdate()`

**REQ-5**: No other allocation logic SHALL be modified. The change is limited to the `orderBy` clause.

## Scenarios

### Scenario 1: Price Reduction Creates Fair Queue

**GIVEN** three sellers with tickets in the same price group:
- Seller A lists ticket at $1500 on Jan 1
- Seller B lists ticket at $1000 on Jan 2
- Seller C lists ticket at $1000 on Jan 3
- Seller A reduces price to $1000 on Jan 4

**WHEN** a buyer purchases a $1000 ticket

**THEN** the system SHALL allocate in this order:
1. Seller B (updatedAt = Jan 2)
2. Seller C (updatedAt = Jan 3)
3. Seller A (updatedAt = Jan 4)

### Scenario 2: Never-Updated Tickets Maintain Current Behavior

**GIVEN** two sellers who never changed their prices:
- Seller X lists at $500 on Feb 1 (updatedAt = createdAt = Feb 1)
- Seller Y lists at $500 on Feb 2 (updatedAt = createdAt = Feb 2)

**WHEN** a buyer purchases a $500 ticket

**THEN** Seller X's ticket SHALL be allocated first (identical to current createdAt-based ordering)

### Scenario 3: Multiple Price Changes

**GIVEN** a seller changes price twice:
- Lists at $2000 on March 1
- Reduces to $1500 on March 5
- Reduces to $1200 on March 10

**WHEN** compared against another seller who listed at $1200 on March 8

**THEN** the March 8 listing SHALL be allocated first (updatedAt = March 8 < March 10)

## Non-Functional Requirements

**NFR-1**: The change SHALL NOT require database migrations or schema modifications.

**NFR-2**: The change SHALL NOT impact query performance measurably (orderBy column change is performance-neutral).

**NFR-3**: Existing tickets SHALL continue functioning without data backfills or updates.

## Validation

**VAL-1**: The price update service/repository MUST set `updatedAt` when changing ticket prices, either via explicit field assignment or DB-level triggers.

**VAL-2**: Unit tests SHOULD verify the correct ordering behavior for the three scenarios above.
