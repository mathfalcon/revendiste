// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@mathfalcon/tsoa-runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@mathfalcon/tsoa-runtime';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EventsController } from './controllers/events/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './controllers/health/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TicketListingsController } from './controllers/ticket-listings/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OrdersController } from './controllers/orders/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PayoutsController } from './controllers/payouts/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WebhooksController } from './controllers/webhooks/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PaymentsController } from './controllers/payments/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NotificationsController } from './controllers/notifications/index';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');




// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "EventImageType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["flyer"]},{"dataType":"enum","enums":["hero"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationMeta": {
        "dataType": "refObject",
        "properties": {
            "page": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "total": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "hasNext": {"dataType":"boolean","required":true},
            "hasPrev": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedResponse__createdAt-Date--description-string-or-null--eventEndDate-Date--eventStartDate-Date--externalUrl-string--id-string--name-string--status-string--updatedAt-Date--venueAddress-string--venueName-string-or-null--lowestAvailableTicketPrice-number-or-null--lowestAvailableTicketCurrency-string-or-null--images_58__url-string--imageType-EventImageType_-Array__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"lowestAvailableTicketCurrency":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"lowestAvailableTicketPrice":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventsPaginatedResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedResponse__createdAt-Date--description-string-or-null--eventEndDate-Date--eventStartDate-Date--externalUrl-string--id-string--name-string--status-string--updatedAt-Date--venueAddress-string--venueName-string-or-null--lowestAvailableTicketPrice-number-or-null--lowestAvailableTicketCurrency-string-or-null--images_58__url-string--imageType-EventImageType_-Array__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofPaginationSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationQuery": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofPaginationSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SearchEventsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"eventImages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventTicketCurrency": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventByIdResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaves":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"priceGroups":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"availableTickets":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"}],"required":true},"price":{"dataType":"string","required":true}}},"required":true},"faceValue":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},"eventImages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HealthCheckResult": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["healthy"]},{"dataType":"enum","enums":["unhealthy"]},{"dataType":"enum","enums":["degraded"]}],"required":true},
            "message": {"dataType":"string"},
            "responseTime": {"dataType":"double"},
            "details": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HealthCheck": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["healthy"]},{"dataType":"enum","enums":["unhealthy"]},{"dataType":"enum","enums":["degraded"]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
            "uptime": {"dataType":"double","required":true},
            "version": {"dataType":"string","required":true},
            "checks": {"dataType":"nestedObjectLiteral","nestedProperties":{"external":{"ref":"HealthCheckResult"},"disk":{"ref":"HealthCheckResult","required":true},"memory":{"ref":"HealthCheckResult","required":true},"database":{"ref":"HealthCheckResult"}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTicketListingResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaveId":{"dataType":"string","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"publisherUserId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true},"listingTickets":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketNumber":{"dataType":"double","required":true},"price":{"dataType":"string","required":true},"listingId":{"dataType":"string","required":true},"documentUploadRequiredNotifiedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"documentUploadedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"documentType":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentSizeBytes":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"documentPath":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentOriginalName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UnauthorizedError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","required":true},
            "isOperational": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BadRequestError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","required":true},
            "isOperational": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotFoundError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","required":true},
            "isOperational": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "statusCode": {"dataType":"double","required":true},
            "isOperational": {"dataType":"boolean","required":true},
            "metadata": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTicketListingRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"quantity":{"dataType":"double","required":true},"price":{"dataType":"double","required":true},"ticketWaveId":{"dataType":"string","required":true},"eventId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadAvailabilityReason": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["event_ended"]},{"dataType":"enum","enums":["too_early"]},{"dataType":"enum","enums":["unknown"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserListingsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"event":{"dataType":"nestedObjectLiteral","nestedProperties":{"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"string","required":true},"platform":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"eventStartDate":{"dataType":"string","required":true},"eventEndDate":{"dataType":"string","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"required":true},"ticketWave":{"dataType":"nestedObjectLiteral","nestedProperties":{"currency":{"ref":"EventTicketCurrency","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true},"tickets":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"uploadedAt":{"dataType":"string","required":true},"status":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"ticketNumber":{"dataType":"double","required":true},"price":{"dataType":"string","required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true},"uploadUnavailableReason":{"dataType":"union","subSchemas":[{"ref":"UploadAvailabilityReason"},{"dataType":"undefined"}],"required":true},"canUploadDocument":{"dataType":"boolean","required":true},"hasDocument":{"dataType":"boolean","required":true}}},"required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadDocumentResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"documentUrl":{"dataType":"string","required":true},"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"version":{"dataType":"double","required":true},"verifiedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"verifiedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"uploadedAt":{"dataType":"datetime","required":true},"ticketId":{"dataType":"string","required":true},"storagePath":{"dataType":"string","required":true},"sizeBytes":{"dataType":"double","required":true},"originalName":{"dataType":"string","required":true},"mimeType":{"dataType":"string","required":true},"isPrimary":{"dataType":"boolean","required":true},"fileName":{"dataType":"string","required":true},"documentType":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrderResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"vatOnCommission":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"reservationExpiresAt":{"dataType":"datetime","required":true},"platformCommission":{"dataType":"string","required":true},"confirmedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"eventId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.Record_string.number__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrderRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ticketSelections":{"ref":"Record_string.Record_string.number__","required":true},"eventId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetOrderByIdResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaveName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"subtotal":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"quantity":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"pricePerTicket":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"ticketWaveId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"dataType":"union","subSchemas":[{"ref":"EventTicketCurrency"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},"event":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"platform":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventEndDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"vatOnCommission":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"reservationExpiresAt":{"dataType":"datetime","required":true},"platformCommission":{"dataType":"string","required":true},"confirmedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"eventId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserOrdersResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaveName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"subtotal":{"dataType":"string","required":true},"quantity":{"dataType":"double","required":true},"pricePerTicket":{"dataType":"string","required":true},"ticketWaveId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"currency":{"dataType":"union","subSchemas":[{"ref":"EventTicketCurrency"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},"event":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"platform":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventEndDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"vatOnCommission":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"reservationExpiresAt":{"dataType":"datetime","required":true},"platformCommission":{"dataType":"string","required":true},"confirmedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"eventId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetOrderTicketsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"tickets":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"mimeType":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"uploadedAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"ticketWave":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"hasDocument":{"dataType":"boolean","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"price":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"vatOnCommission":{"dataType":"string","required":true},"platformCommission":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"event":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"orderId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BalanceByCurrency": {
        "dataType": "refObject",
        "properties": {
            "currency": {"ref":"EventTicketCurrency","required":true},
            "amount": {"dataType":"string","required":true},
            "count": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SellerBalance": {
        "dataType": "refObject",
        "properties": {
            "available": {"dataType":"array","array":{"dataType":"refObject","ref":"BalanceByCurrency"},"required":true},
            "retained": {"dataType":"array","array":{"dataType":"refObject","ref":"BalanceByCurrency"},"required":true},
            "pending": {"dataType":"array","array":{"dataType":"refObject","ref":"BalanceByCurrency"},"required":true},
            "total": {"dataType":"array","array":{"dataType":"refObject","ref":"BalanceByCurrency"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetBalanceResponse": {
        "dataType": "refAlias",
        "type": {"ref":"SellerBalance","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EarningsForSelection": {
        "dataType": "refObject",
        "properties": {
            "byListing": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"currency":{"ref":"EventTicketCurrency","required":true},"ticketCount":{"dataType":"double","required":true},"totalAmount":{"dataType":"string","required":true},"publisherUserId":{"dataType":"string","required":true},"listingId":{"dataType":"string","required":true}}},"required":true},
            "byTicket": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"publisherUserId":{"dataType":"string","required":true},"listingId":{"dataType":"string","required":true},"holdUntil":{"dataType":"datetime","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"sellerAmount":{"dataType":"string","required":true},"listingTicketId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetAvailableEarningsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"EarningsForSelection","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetPayoutHistoryResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"ref":"PaginationMeta","required":true},"data":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"linkedEarnings":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"sellerAmount":{"dataType":"string","required":true},"listingTicketId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"amount":{"dataType":"string","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"id":{"dataType":"string","required":true}}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonArray": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"refAlias","ref":"JsonValue"},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonValue": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"JsonArray"},{"ref":"JsonObject"},{"ref":"JsonPrimitive"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonObject": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"union","subSchemas":[{"ref":"JsonValue"},{"dataType":"undefined"}]},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonPrimitive": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"double"},{"dataType":"string"},{"dataType":"enum","enums":[null]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestPayoutResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestPayoutRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"listingIds":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"undefined"}]},"listingTicketIds":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"undefined"}]},"payoutMethodId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PayoutType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["paypal"]},{"dataType":"enum","enums":["uruguayan_bank"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetPayoutMethodsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"payoutType":{"ref":"PayoutType","required":true},"isDefault":{"dataType":"boolean","required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true},"userId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddPayoutMethodResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"payoutType":{"ref":"PayoutType","required":true},"isDefault":{"dataType":"boolean","required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true},"userId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddPayoutMethodRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Itau"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["OCA Blue"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["PREX"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Banco Nacion Arg"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Bandes"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["BBVA"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["BHU"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["BROU"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Citibank"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Dinero Electronico ANDA"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["FUCAC"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["FUCEREP"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["GRIN"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Heritage"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["HSBC"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Mercadopago"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Midinero"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Santander"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"account_number":{"dataType":"string","required":true},"bank_name":{"dataType":"enum","enums":["Scotiabank"],"required":true}}}],"required":true},"payoutType":{"dataType":"enum","enums":["uruguayan_bank"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}},"required":true},"payoutType":{"dataType":"enum","enums":["paypal"],"required":true}}}]},{"dataType":"nestedObjectLiteral","nestedProperties":{"isDefault":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"undefined"}]},"currency":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]}],"required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePayoutMethodResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"payoutType":{"ref":"PayoutType","required":true},"isDefault":{"dataType":"boolean","required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true},"userId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePayoutMethodRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"isDefault":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"undefined"}]},"metadata":{"dataType":"any"},"currency":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]},{"dataType":"undefined"}]},"accountHolderSurname":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"accountHolderName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DLocalWebhookrRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"payment_id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatePaymentLinkResponse": {
        "dataType": "refObject",
        "properties": {
            "redirectUrl": {"dataType":"string","required":true},
            "paymentId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_Notification.Exclude_keyofNotification.metadata-or-actions-or-type-or-title-or-description__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["seen"]},{"dataType":"enum","enums":["sent"]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"channels":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["email"]},{"dataType":"enum","enums":["in_app"]},{"dataType":"enum","enums":["sms"]}]},"required":true},"channelStatus":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"retryCount":{"dataType":"double","required":true},"seenAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_Notification.metadata-or-actions-or-type-or-title-or-description_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Notification.Exclude_keyofNotification.metadata-or-actions-or-type-or-title-or-description__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["document_reminder"]},{"dataType":"enum","enums":["document_uploaded"]},{"dataType":"enum","enums":["order_confirmed"]},{"dataType":"enum","enums":["order_expired"]},{"dataType":"enum","enums":["payment_failed"]},{"dataType":"enum","enums":["payment_succeeded"]},{"dataType":"enum","enums":["ticket_sold_seller"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedNotificationMetadata_NotificationMetadata_": {
        "dataType": "refAlias",
        "type": {"ref":"Extract_NotificationMetadata._type-NotificationMetadata__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Extract_NotificationMetadata._type-NotificationMetadata__": {
        "dataType": "refAlias",
        "type": {"ref":"TypedNotificationMetadata_NotificationMetadata_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Extract_NotificationMetadata._type-NotificationType__": {
        "dataType": "refAlias",
        "type": {"ref":"TypedNotificationMetadata_NotificationMetadata_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedNotificationMetadata_NotificationType_": {
        "dataType": "refAlias",
        "type": {"ref":"Extract_NotificationMetadata._type-NotificationType__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofBaseActionSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"ref":"Record_string.unknown_"},{"dataType":"undefined"}]},"url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"label":{"dataType":"string","required":true},"type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["upload_documents"]},{"dataType":"enum","enums":["view_order"]},{"dataType":"enum","enums":["retry_payment"]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationAction": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofBaseActionSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedNotification": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Omit_Notification.metadata-or-actions-or-type-or-title-or-description_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"actions":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refAlias","ref":"NotificationAction"}},{"dataType":"enum","enums":[null]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"ref":"TypedNotificationMetadata_NotificationType_"},{"dataType":"enum","enums":[null]}],"required":true},"description":{"dataType":"string","required":true},"title":{"dataType":"string","required":true},"type":{"ref":"NotificationType","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedResponse_TypedNotification_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"TypedNotification"},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetNotificationsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedResponse_TypedNotification_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetNotificationsQuery": {
        "dataType": "refObject",
        "properties": {
            "sortOrder": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},
            "sortBy": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},
            "limit": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "includeSeen": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUnseenCountResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"double","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MarkAsSeenResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"TypedNotification"},{"dataType":"enum","enums":[null]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MarkAllAsSeenResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"refAlias","ref":"TypedNotification"},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteNotificationResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"TypedNotification"},{"dataType":"enum","enums":[null]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"silently-remove-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed @mathfalcon/tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsEventsController_getAllPaginated: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/events',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getAllPaginated)),

            async function EventsController_getAllPaginated(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_getAllPaginated, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'getAllPaginated',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventsController_getBySearch: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"query","name":"query","required":true,"dataType":"string"},
                limit: {"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/events/search',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getBySearch)),

            async function EventsController_getBySearch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_getBySearch, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'getBySearch',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventsController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/events/:eventId',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getById)),

            async function EventsController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_getById, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_basic: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.basic)),

            async function HealthController_basic(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_basic, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'basic',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_detailed: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/detailed',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.detailed)),

            async function HealthController_detailed(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_detailed, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'detailed',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_database: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/database',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.database)),

            async function HealthController_database(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_database, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'database',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_memory: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/memory',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.memory)),

            async function HealthController_memory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_memory, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'memory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_readiness: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/ready',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.readiness)),

            async function HealthController_readiness(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_readiness, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'readiness',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_liveness: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/live',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.liveness)),

            async function HealthController_liveness(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_liveness, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'liveness',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTicketListingsController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateTicketListingRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/ticket-listings',
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.create)),

            async function TicketListingsController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_create, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTicketListingsController_getMyListings: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/ticket-listings/my-listings',
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.getMyListings)),

            async function TicketListingsController_getMyListings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_getMyListings, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'getMyListings',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTicketListingsController_uploadDocument: Record<string, TsoaRoute.ParameterSchema> = {
                ticketId: {"in":"path","name":"ticketId","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/ticket-listings/tickets/:ticketId/document',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.uploadDocument)),

            async function TicketListingsController_uploadDocument(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_uploadDocument, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'uploadDocument',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTicketListingsController_updateDocument: Record<string, TsoaRoute.ParameterSchema> = {
                ticketId: {"in":"path","name":"ticketId","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/ticket-listings/tickets/:ticketId/document',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.updateDocument)),

            async function TicketListingsController_updateDocument(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_updateDocument, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'updateDocument',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrdersController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateOrderRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/orders',
            ...(fetchMiddlewares<RequestHandler>(OrdersController)),
            ...(fetchMiddlewares<RequestHandler>(OrdersController.prototype.create)),

            async function OrdersController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrdersController_create, request, response });

                const controller = new OrdersController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrdersController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                orderId: {"in":"path","name":"orderId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/orders/:orderId',
            ...(fetchMiddlewares<RequestHandler>(OrdersController)),
            ...(fetchMiddlewares<RequestHandler>(OrdersController.prototype.getById)),

            async function OrdersController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrdersController_getById, request, response });

                const controller = new OrdersController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrdersController_getMyOrders: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/orders',
            ...(fetchMiddlewares<RequestHandler>(OrdersController)),
            ...(fetchMiddlewares<RequestHandler>(OrdersController.prototype.getMyOrders)),

            async function OrdersController_getMyOrders(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrdersController_getMyOrders, request, response });

                const controller = new OrdersController();

              await templateService.apiHandler({
                methodName: 'getMyOrders',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrdersController_getOrderTickets: Record<string, TsoaRoute.ParameterSchema> = {
                orderId: {"in":"path","name":"orderId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/orders/:orderId/tickets',
            ...(fetchMiddlewares<RequestHandler>(OrdersController)),
            ...(fetchMiddlewares<RequestHandler>(OrdersController.prototype.getOrderTickets)),

            async function OrdersController_getOrderTickets(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrdersController_getOrderTickets, request, response });

                const controller = new OrdersController();

              await templateService.apiHandler({
                methodName: 'getOrderTickets',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_getBalance: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/payouts/balance',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.getBalance)),

            async function PayoutsController_getBalance(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_getBalance, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'getBalance',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_getAvailableEarnings: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/payouts/available-earnings',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.getAvailableEarnings)),

            async function PayoutsController_getAvailableEarnings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_getAvailableEarnings, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'getAvailableEarnings',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_getPayoutHistory: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/payouts/history',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.getPayoutHistory)),

            async function PayoutsController_getPayoutHistory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_getPayoutHistory, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'getPayoutHistory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_requestPayout: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"RequestPayoutRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/payouts/request',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.requestPayout)),

            async function PayoutsController_requestPayout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_requestPayout, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'requestPayout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_getPayoutMethods: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/payouts/payout-methods',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.getPayoutMethods)),

            async function PayoutsController_getPayoutMethods(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_getPayoutMethods, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'getPayoutMethods',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_addPayoutMethod: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"AddPayoutMethodRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/payouts/payout-methods',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.addPayoutMethod)),

            async function PayoutsController_addPayoutMethod(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_addPayoutMethod, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'addPayoutMethod',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_updatePayoutMethod: Record<string, TsoaRoute.ParameterSchema> = {
                payoutMethodId: {"in":"path","name":"payoutMethodId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdatePayoutMethodRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/payouts/payout-methods/:payoutMethodId',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.updatePayoutMethod)),

            async function PayoutsController_updatePayoutMethod(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_updatePayoutMethod, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'updatePayoutMethod',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPayoutsController_deletePayoutMethod: Record<string, TsoaRoute.ParameterSchema> = {
                payoutMethodId: {"in":"path","name":"payoutMethodId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/payouts/payout-methods/:payoutMethodId',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.deletePayoutMethod)),

            async function PayoutsController_deletePayoutMethod(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_deletePayoutMethod, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'deletePayoutMethod',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWebhooksController_handleDLocalWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"DLocalWebhookrRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/webhooks/dlocal',
            ...(fetchMiddlewares<RequestHandler>(WebhooksController)),
            ...(fetchMiddlewares<RequestHandler>(WebhooksController.prototype.handleDLocalWebhook)),

            async function WebhooksController_handleDLocalWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWebhooksController_handleDLocalWebhook, request, response });

                const controller = new WebhooksController();

              await templateService.apiHandler({
                methodName: 'handleDLocalWebhook',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPaymentsController_createPaymentLink: Record<string, TsoaRoute.ParameterSchema> = {
                orderId: {"in":"path","name":"orderId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/payments/create-link/:orderId',
            ...(fetchMiddlewares<RequestHandler>(PaymentsController)),
            ...(fetchMiddlewares<RequestHandler>(PaymentsController.prototype.createPaymentLink)),

            async function PaymentsController_createPaymentLink(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPaymentsController_createPaymentLink, request, response });

                const controller = new PaymentsController();

              await templateService.apiHandler({
                methodName: 'createPaymentLink',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_getNotifications: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"ref":"GetNotificationsQuery"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/notifications',
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.getNotifications)),

            async function NotificationsController_getNotifications(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_getNotifications, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'getNotifications',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_getUnseenCount: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/notifications/unseen-count',
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.getUnseenCount)),

            async function NotificationsController_getUnseenCount(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_getUnseenCount, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'getUnseenCount',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_markAsSeen: Record<string, TsoaRoute.ParameterSchema> = {
                notificationId: {"in":"path","name":"notificationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/notifications/:notificationId/seen',
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.markAsSeen)),

            async function NotificationsController_markAsSeen(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_markAsSeen, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'markAsSeen',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_markAllAsSeen: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/notifications/seen-all',
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.markAllAsSeen)),

            async function NotificationsController_markAllAsSeen(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_markAllAsSeen, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'markAllAsSeen',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotificationsController_deleteNotification: Record<string, TsoaRoute.ParameterSchema> = {
                notificationId: {"in":"path","name":"notificationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/notifications/:notificationId',
            ...(fetchMiddlewares<RequestHandler>(NotificationsController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationsController.prototype.deleteNotification)),

            async function NotificationsController_deleteNotification(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationsController_deleteNotification, request, response });

                const controller = new NotificationsController();

              await templateService.apiHandler({
                methodName: 'deleteNotification',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
