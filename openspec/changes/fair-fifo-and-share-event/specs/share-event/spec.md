# Specification: Share Event Button

## Overview

Sellers MUST be able to share event page URLs directly from their publications view to promote their listings and drive traffic to the marketplace. The system SHALL provide a native sharing experience on mobile devices and a clipboard-based fallback on desktop.

## Requirements

### UI Component

**REQ-1**: A share button SHALL be added to the `ListingCard` component header area, positioned near the event name or status badge.

**REQ-2**: The button MUST use a recognizable share icon from the existing icon library.

**REQ-3**: The button SHOULD be visually distinct but not dominant, maintaining the card's existing visual hierarchy.

### Share Behavior

**REQ-4**: The system SHALL detect if the Web Share API (`navigator.share`) is available.

**REQ-5**: If Web Share API is available, clicking the button MUST invoke `navigator.share()` with:
- `title`: The event name
- `url`: `{window.location.origin}/eventos/{slug}`

**REQ-6**: If Web Share API is NOT available, clicking the button MUST:
1. Copy the event URL to the clipboard via `navigator.clipboard.writeText()`
2. Display a toast notification with the message "Enlace copiado"

**REQ-7**: The shared URL MUST NOT contain seller identification, listing IDs, or any tracking parameters. The marketplace experience SHALL remain neutral.

### Data Requirements

**REQ-8**: The event slug MUST be retrieved from the existing listing data (`event.slug` field).

**REQ-9**: No additional API calls SHALL be made to fetch share data.

### Error Handling

**REQ-10**: If clipboard write fails (permissions denied or unsupported), the system SHOULD display a toast with the message "No se pudo copiar el enlace" and log the error.

**REQ-11**: If Web Share API is canceled by the user, no toast or error message SHALL be shown.

## Scenarios

### Scenario 1: Mobile Share via Web Share API

**GIVEN** a seller is viewing their publications on a mobile browser with Web Share API support

**WHEN** they click the share button on a listing for "Coldplay - Buenos Aires"

**THEN** the native share sheet SHALL open with:
- Title: "Coldplay - Buenos Aires"
- URL: `https://revendiste.com/eventos/coldplay-buenos-aires`

**AND** they MAY share via any app (WhatsApp, Telegram, email, etc.)

### Scenario 2: Desktop Clipboard Copy

**GIVEN** a seller is viewing their publications on a desktop browser without Web Share API

**WHEN** they click the share button on a listing for "Lollapalooza 2026"

**THEN** the URL `https://revendiste.com/eventos/lollapalooza-2026` SHALL be copied to their clipboard

**AND** a toast notification "Enlace copiado" SHALL appear

### Scenario 3: Clipboard Permission Denied

**GIVEN** a seller on desktop with clipboard permissions denied

**WHEN** they click the share button

**THEN** the system SHALL display a toast "No se pudo copiar el enlace"

**AND** log the error to the console for debugging

## Non-Functional Requirements

**NFR-1**: The share action SHALL NOT introduce noticeable UI lag or delay.

**NFR-2**: The component SHALL be accessible via keyboard navigation (tab to button, Enter/Space to activate).

**NFR-3**: Analytics tracking for share actions is OPTIONAL and MAY be added in future iterations.

## Validation

**VAL-1**: The event slug MUST be present in the listing data. If missing, the share button SHOULD be hidden or disabled.

**VAL-2**: Manual testing MUST verify both Web Share API flow (mobile) and clipboard fallback (desktop).
