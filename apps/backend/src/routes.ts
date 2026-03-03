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
import { AdminPayoutsController } from './controllers/admin/payouts/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminIdentityVerificationController } from './controllers/admin/identity-verification/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminEventsController } from './controllers/admin/events/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './controllers/users/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WebhooksController } from './controllers/webhooks/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PaymentsController } from './controllers/payments/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NotificationsController } from './controllers/notifications/index';
// WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IdentityVerificationController } from './controllers/identity-verification/index';
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
    "PaginatedResponse__createdAt-Date--description-string-or-null--eventEndDate-Date--eventStartDate-Date--externalUrl-string--id-string--name-string--status-string--updatedAt-Date--venueName-string-or-null--venueAddress-string-or-null--venueCity-string-or-null--lowestAvailableTicketPrice-number-or-null--lowestAvailableTicketCurrency-string-or-null--images_58__url-string--imageType-EventImageType_-Array__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"lowestAvailableTicketCurrency":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"lowestAvailableTicketPrice":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"venueCity":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventsPaginatedResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedResponse__createdAt-Date--description-string-or-null--eventEndDate-Date--eventStartDate-Date--externalUrl-string--id-string--name-string--status-string--updatedAt-Date--venueName-string-or-null--venueAddress-string-or-null--venueCity-string-or-null--lowestAvailableTicketPrice-number-or-null--lowestAvailableTicketCurrency-string-or-null--images_58__url-string--imageType-EventImageType_-Array__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofPaginationSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventsPaginatedQuery": {
        "dataType": "refObject",
        "properties": {
            "sortOrder": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},
            "sortBy": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},
            "limit": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "city": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SearchEventsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"eventImages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueCity":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetTrendingEventsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"venue":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"city":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"totalViews":{"dataType":"double","required":true},"eventImages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"lowestAvailableTicketCurrency":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"lowestAvailableTicketPrice":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true},"venueId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetDistinctCitiesResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"string"},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QrAvailabilityTiming": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["12h"]},{"dataType":"enum","enums":["24h"]},{"dataType":"enum","enums":["3h"]},{"dataType":"enum","enums":["48h"]},{"dataType":"enum","enums":["6h"]},{"dataType":"enum","enums":["72h"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventTicketCurrency": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventByIdResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaves":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"priceGroups":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"availableTickets":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"}],"required":true},"price":{"dataType":"string","required":true}}},"required":true},"faceValue":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},"userListingsCount":{"dataType":"double","required":true},"eventImages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueCity":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"qrAvailabilityTiming":{"dataType":"union","subSchemas":[{"ref":"QrAvailabilityTiming"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TrackViewResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
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
            "details": {"ref":"Record_string.unknown_"},
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaveId":{"dataType":"string","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"publisherUserId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true},"listingTickets":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketNumber":{"dataType":"double","required":true},"price":{"dataType":"string","required":true},"listingId":{"dataType":"string","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true}},"validators":{}},
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
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"undefined"},{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"}}],"validators":{}},
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
    "PaginatedResponse__tickets_58__hasDocument-boolean--canUploadDocument-boolean--uploadUnavailableReason-UploadAvailabilityReason-or-undefined--uploadAvailableAt-string-or-undefined--createdAt-string--deletedAt-string-or-null--id-string--updatedAt-string--soldAt-string-or-null--price-string--ticketNumber-number--document_58__id-string--status-string--uploadedAt-string_-or-null_-Array--createdAt-Date--id-string--updatedAt-Date--soldAt-Date-or-null--ticketWave_58__id-string--name-string--currency-EventTicketCurrency--faceValue-string_--event_58__description-string-or-null--eventEndDate-string--eventStartDate-string--id-string--name-string--platform-string--qrAvailabilityTiming-QrAvailabilityTiming-or-null--venueName-string-or-null--venueAddress-string-or-null--eventImages_58__url-string--imageType-EventImageType_-Array___": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"event":{"dataType":"nestedObjectLiteral","nestedProperties":{"eventImages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"qrAvailabilityTiming":{"dataType":"union","subSchemas":[{"ref":"QrAvailabilityTiming"},{"dataType":"enum","enums":[null]}],"required":true},"platform":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"eventStartDate":{"dataType":"string","required":true},"eventEndDate":{"dataType":"string","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"required":true},"ticketWave":{"dataType":"nestedObjectLiteral","nestedProperties":{"faceValue":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true},"tickets":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"uploadedAt":{"dataType":"string","required":true},"status":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"ticketNumber":{"dataType":"double","required":true},"price":{"dataType":"string","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"string","required":true},"uploadAvailableAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true},"uploadUnavailableReason":{"dataType":"union","subSchemas":[{"ref":"UploadAvailabilityReason"},{"dataType":"undefined"}],"required":true},"canUploadDocument":{"dataType":"boolean","required":true},"hasDocument":{"dataType":"boolean","required":true}}},"required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserListingsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedResponse__tickets_58__hasDocument-boolean--canUploadDocument-boolean--uploadUnavailableReason-UploadAvailabilityReason-or-undefined--uploadAvailableAt-string-or-undefined--createdAt-string--deletedAt-string-or-null--id-string--updatedAt-string--soldAt-string-or-null--price-string--ticketNumber-number--document_58__id-string--status-string--uploadedAt-string_-or-null_-Array--createdAt-Date--id-string--updatedAt-Date--soldAt-Date-or-null--ticketWave_58__id-string--name-string--currency-EventTicketCurrency--faceValue-string_--event_58__description-string-or-null--eventEndDate-string--eventStartDate-string--id-string--name-string--platform-string--qrAvailabilityTiming-QrAvailabilityTiming-or-null--venueName-string-or-null--venueAddress-string-or-null--eventImages_58__url-string--imageType-EventImageType_-Array___","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadDocumentResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"documentUrl":{"dataType":"string","required":true},"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"version":{"dataType":"double","required":true},"verifiedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"verifiedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"ticketId":{"dataType":"string","required":true},"isPrimary":{"dataType":"boolean","required":true},"uploadedAt":{"dataType":"datetime","required":true},"storagePath":{"dataType":"string","required":true},"sizeBytes":{"dataType":"double","required":true},"originalName":{"dataType":"string","required":true},"mimeType":{"dataType":"string","required":true},"fileName":{"dataType":"string","required":true},"documentType":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTicketPriceResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketNumber":{"dataType":"double","required":true},"price":{"dataType":"string","required":true},"listingId":{"dataType":"string","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTicketPriceRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"price":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RemoveTicketResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketNumber":{"dataType":"double","required":true},"price":{"dataType":"string","required":true},"listingId":{"dataType":"string","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetTicketInfoResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWave":{"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true}},"required":true},"event":{"dataType":"nestedObjectLiteral","nestedProperties":{"startDate":{"dataType":"datetime","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},"documentHistory":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"string","required":true},"isPrimary":{"dataType":"boolean","required":true},"uploadedAt":{"dataType":"datetime","required":true},"version":{"dataType":"double","required":true},"id":{"dataType":"string","required":true}}},"required":true},"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"status":{"dataType":"string","required":true},"version":{"dataType":"double","required":true},"sizeBytes":{"dataType":"double","required":true},"originalName":{"dataType":"string","required":true},"mimeType":{"dataType":"string","required":true},"uploadedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"hasDocument":{"dataType":"boolean","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"price":{"dataType":"string","required":true},"ticketNumber":{"dataType":"double","required":true},"listingId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrderResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"vatOnCommission":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"reservationExpiresAt":{"dataType":"datetime","required":true},"platformCommission":{"dataType":"string","required":true},"confirmedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"eventId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaveName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"subtotal":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"quantity":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"pricePerTicket":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"ticketWaveId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"dataType":"union","subSchemas":[{"ref":"EventTicketCurrency"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},"event":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"qrAvailabilityTiming":{"dataType":"union","subSchemas":[{"ref":"QrAvailabilityTiming"},{"dataType":"enum","enums":[null]}],"required":true},"platform":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventEndDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"vatOnCommission":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"reservationExpiresAt":{"dataType":"datetime","required":true},"platformCommission":{"dataType":"string","required":true},"confirmedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"eventId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedResponse__createdAt-Date--id-string--status-cancelled-or-confirmed-or-expired-or-pending--updatedAt-Date--eventId-string--currency-EventTicketCurrency--totalAmount-string--userId-string--cancelledAt-Date-or-null--confirmedAt-Date-or-null--platformCommission-string--reservationExpiresAt-Date--subtotalAmount-string--vatOnCommission-string--event_58__eventEndDate-string-or-null--eventStartDate-string-or-null--id-string-or-null--name-string-or-null--platform-string-or-null--venueName-string-or-null--venueAddress-string-or-null--images_58__url-string--imageType-EventImageType_-Array_-or-null--items_58__currency-EventTicketCurrency-or-null--id-string--ticketWaveId-string--pricePerTicket-string--quantity-number--subtotal-string--ticketWaveName-string-or-null_-Array__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"items":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"ticketWaveName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"subtotal":{"dataType":"string","required":true},"quantity":{"dataType":"double","required":true},"pricePerTicket":{"dataType":"string","required":true},"ticketWaveId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"currency":{"dataType":"union","subSchemas":[{"ref":"EventTicketCurrency"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},"event":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"platform":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"eventEndDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"vatOnCommission":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"reservationExpiresAt":{"dataType":"datetime","required":true},"platformCommission":{"dataType":"string","required":true},"confirmedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"userId":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"eventId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserOrdersResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedResponse__createdAt-Date--id-string--status-cancelled-or-confirmed-or-expired-or-pending--updatedAt-Date--eventId-string--currency-EventTicketCurrency--totalAmount-string--userId-string--cancelledAt-Date-or-null--confirmedAt-Date-or-null--platformCommission-string--reservationExpiresAt-Date--subtotalAmount-string--vatOnCommission-string--event_58__eventEndDate-string-or-null--eventStartDate-string-or-null--id-string-or-null--name-string-or-null--platform-string-or-null--venueName-string-or-null--venueAddress-string-or-null--images_58__url-string--imageType-EventImageType_-Array_-or-null--items_58__currency-EventTicketCurrency-or-null--id-string--ticketWaveId-string--pricePerTicket-string--quantity-number--subtotal-string--ticketWaveName-string-or-null_-Array__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetOrderTicketsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"tickets":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"document":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"mimeType":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"uploadedAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"ticketWave":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"reservationStatus":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["active"]},{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["refund_pending"]},{"dataType":"enum","enums":["refunded"]}],"required":true},"hasDocument":{"dataType":"boolean","required":true},"soldAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"price":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"vatOnCommission":{"dataType":"string","required":true},"platformCommission":{"dataType":"string","required":true},"totalAmount":{"dataType":"string","required":true},"subtotalAmount":{"dataType":"string","required":true},"event":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"orderId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CancelOrderResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"cancelledAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["pending"]}],"required":true},"id":{"dataType":"string","required":true}},"validators":{}},
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
            "payoutPending": {"dataType":"array","array":{"dataType":"refObject","ref":"BalanceByCurrency"},"required":true},
            "paidOut": {"dataType":"array","array":{"dataType":"refObject","ref":"BalanceByCurrency"},"required":true},
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
    "PaginationQuery": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofPaginationSchema_","validators":{}},
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"validators":{}},
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
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Itau"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["OCA Blue"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["PREX"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Banco Nacion Arg"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Bandes"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["BBVA"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["BHU"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["BROU"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Citibank"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Dinero Electronico ANDA"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["FUCAC"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["FUCEREP"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["GRIN"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Heritage"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["HSBC"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Mercadopago"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Midinero"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Santander"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"accountNumber":{"dataType":"string","required":true},"bankName":{"dataType":"enum","enums":["Scotiabank"],"required":true}}}],"required":true},"payoutType":{"dataType":"enum","enums":["uruguayan_bank"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}},"required":true},"payoutType":{"dataType":"enum","enums":["paypal"],"required":true}}}]},{"dataType":"nestedObjectLiteral","nestedProperties":{"isDefault":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"undefined"}]},"currency":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]}],"required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true}}}],"validators":{}},
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
    "PayoutEventType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["admin_processed"]},{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["payout_requested"]},{"dataType":"enum","enums":["status_change"]},{"dataType":"enum","enums":["transfer_completed"]},{"dataType":"enum","enums":["transfer_failed"]},{"dataType":"enum","enums":["transfer_initiated"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PayoutStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["processing"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserPayoutDetailsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"linkedEarnings":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"sellerAmount":{"dataType":"string","required":true},"listingTicketId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true}}},"required":true},"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true},"payoutMethod":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true},"payoutType":{"ref":"PayoutType","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"documents":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"uploadedBy":{"dataType":"string","required":true},"uploadedAt":{"dataType":"datetime","required":true},"storagePath":{"dataType":"string","required":true},"sizeBytes":{"dataType":"double","required":true},"payoutId":{"dataType":"string","required":true},"originalName":{"dataType":"string","required":true},"mimeType":{"dataType":"string","required":true},"fileName":{"dataType":"string","required":true},"documentType":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true},"url":{"dataType":"string","required":true}}},"required":true},"events":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"payoutId":{"dataType":"string","required":true},"userAgent":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"toStatus":{"dataType":"union","subSchemas":[{"ref":"PayoutStatus"},{"dataType":"enum","enums":[null]}],"required":true},"ipAddress":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"fromStatus":{"dataType":"union","subSchemas":[{"ref":"PayoutStatus"},{"dataType":"enum","enums":[null]}],"required":true},"eventType":{"ref":"PayoutEventType","required":true},"eventData":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"voucherUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"currencyConversion":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"convertedAt":{"dataType":"string","required":true},"exchangeRate":{"dataType":"double","required":true},"originalCurrency":{"dataType":"string","required":true},"originalAmount":{"dataType":"double","required":true}}},{"dataType":"undefined"}]},"listingIds":{"dataType":"array","array":{"dataType":"string"},"required":true},"listingTicketIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedResponse__createdAt-Date--id-string--metadata-string-or-number-or-boolean-or-JsonArray-or-JsonObject-or-null--status-cancelled-or-pending-or-completed-or-failed-or-processing--updatedAt-Date--currency-EventTicketCurrency--sellerUserId-string--completedAt-Date-or-null--amount-string--failedAt-Date-or-null--failureReason-string-or-null--notes-string-or-null--payoutMethodId-string--processedAt-Date-or-null--processedBy-string-or-null--processingFee-string-or-null--requestedAt-Date--transactionReference-string-or-null--linkedEarnings_58__createdAt-string--id-string--currency-EventTicketCurrency--listingTicketId-string--sellerAmount-string_-Array--seller_58__id-string--email-string--firstName-string-or-null--lastName-string-or-null_-or-null--payoutMethod_58__id-string--accountHolderName-string--accountHolderSurname-string--payoutType-PayoutType_-or-null__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"payoutMethod":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"payoutType":{"ref":"PayoutType","required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"seller":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"lastName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"firstName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"linkedEarnings":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"sellerAmount":{"dataType":"string","required":true},"listingTicketId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true}}},"required":true},"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetPayoutsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedResponse__createdAt-Date--id-string--metadata-string-or-number-or-boolean-or-JsonArray-or-JsonObject-or-null--status-cancelled-or-pending-or-completed-or-failed-or-processing--updatedAt-Date--currency-EventTicketCurrency--sellerUserId-string--completedAt-Date-or-null--amount-string--failedAt-Date-or-null--failureReason-string-or-null--notes-string-or-null--payoutMethodId-string--processedAt-Date-or-null--processedBy-string-or-null--processingFee-string-or-null--requestedAt-Date--transactionReference-string-or-null--linkedEarnings_58__createdAt-string--id-string--currency-EventTicketCurrency--listingTicketId-string--sellerAmount-string_-Array--seller_58__id-string--email-string--firstName-string-or-null--lastName-string-or-null_-or-null--payoutMethod_58__id-string--accountHolderName-string--accountHolderSurname-string--payoutType-PayoutType_-or-null__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofAdminPayoutsQuerySchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"undefined"}]},"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminPayoutsQuery": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofAdminPayoutsQuerySchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetPayoutDetailsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"linkedEarnings":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"sellerAmount":{"dataType":"string","required":true},"listingTicketId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true}}},"required":true},"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true},"payoutMethod":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"currency":{"ref":"EventTicketCurrency","required":true},"accountHolderSurname":{"dataType":"string","required":true},"accountHolderName":{"dataType":"string","required":true},"payoutType":{"ref":"PayoutType","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"settlementInfo":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"providers":{"dataType":"array","array":{"dataType":"string"},"required":true},"hasExchangeRateData":{"dataType":"boolean","required":true},"settlements":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"providers":{"dataType":"array","array":{"dataType":"string"},"required":true},"paymentCount":{"dataType":"double","required":true},"balanceCurrency":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"averageExchangeRate":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"totalSellerAmount":{"dataType":"double","required":true},"totalBalanceFee":{"dataType":"double","required":true},"totalBalanceAmount":{"dataType":"double","required":true},"totalPaymentAmount":{"dataType":"double","required":true},"currency":{"dataType":"string","required":true}}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"documents":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"uploadedBy":{"dataType":"string","required":true},"uploadedAt":{"dataType":"datetime","required":true},"storagePath":{"dataType":"string","required":true},"sizeBytes":{"dataType":"double","required":true},"payoutId":{"dataType":"string","required":true},"originalName":{"dataType":"string","required":true},"mimeType":{"dataType":"string","required":true},"fileName":{"dataType":"string","required":true},"documentType":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true},"url":{"dataType":"string","required":true}}},"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"voucherUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"currencyConversion":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"convertedAt":{"dataType":"string","required":true},"exchangeRate":{"dataType":"double","required":true},"originalCurrency":{"dataType":"string","required":true},"originalAmount":{"dataType":"double","required":true}}},{"dataType":"undefined"}]},"listingIds":{"dataType":"array","array":{"dataType":"string"},"required":true},"listingTicketIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProcessPayoutResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProcessPayoutRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"voucherUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompletePayoutResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompletePayoutRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"voucherUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FailPayoutResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FailPayoutRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"failureReason":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePayoutResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePayoutRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"voucherUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"undefined"}]},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CancelPayoutResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"transactionReference":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestedAt":{"dataType":"datetime","required":true},"processingFee":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"payoutMethodId":{"dataType":"string","required":true},"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"failedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"amount":{"dataType":"string","required":true},"completedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sellerUserId":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["processing"]}],"required":true},"metadata":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CancelPayoutRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"failureReason":{"dataType":"string","required":true},"reasonType":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["error"]},{"dataType":"enum","enums":["other"]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadPayoutDocumentResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"documentUrl":{"dataType":"string","required":true},"document":{"dataType":"nestedObjectLiteral","nestedProperties":{"uploadedBy":{"dataType":"string","required":true},"uploadedAt":{"dataType":"datetime","required":true},"storagePath":{"dataType":"string","required":true},"sizeBytes":{"dataType":"double","required":true},"payoutId":{"dataType":"string","required":true},"originalName":{"dataType":"string","required":true},"mimeType":{"dataType":"string","required":true},"fileName":{"dataType":"string","required":true},"documentType":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"id":{"dataType":"string","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeletePayoutDocumentResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DocumentTypeEnum": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ci_uy"]},{"dataType":"enum","enums":["dni_ar"]},{"dataType":"enum","enums":["passport"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetVerificationsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"hasPrev":{"dataType":"boolean","required":true},"hasNext":{"dataType":"boolean","required":true},"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"required":true},"data":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"verificationConfidenceScores":{"ref":"JsonValue","required":true},"manualReviewReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"verificationAttempts":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"verificationStatus":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["rejected"]},{"dataType":"enum","enums":["requires_manual_review"]},{"dataType":"enum","enums":[null]}],"required":true},"documentCountry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentNumber":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentType":{"dataType":"union","subSchemas":[{"ref":"DocumentTypeEnum"},{"dataType":"enum","enums":[null]}],"required":true},"lastName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"firstName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofAdminVerificationsQuerySchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["rejected"]},{"dataType":"enum","enums":["requires_manual_review"]},{"dataType":"undefined"}]},"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["updatedAt"]},{"dataType":"enum","enums":["verificationAttempts"]}],"required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminVerificationsQuery": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofAdminVerificationsQuerySchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetVerificationDetailsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"failedAt":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{}},{"dataType":"enum","enums":[null]}],"required":true},"failureReason":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{}},{"dataType":"enum","enums":[null]}],"required":true},"processedAt":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{}},{"dataType":"enum","enums":[null]}],"required":true},"livenessSessionId":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{}},{"dataType":"enum","enums":[null]}],"required":true}},"required":true},"images":{"dataType":"nestedObjectLiteral","nestedProperties":{"auditImagesCount":{"dataType":"double","required":true},"hasReferenceImage":{"dataType":"boolean","required":true},"hasDocumentImage":{"dataType":"boolean","required":true}},"required":true},"confidenceScores":{"dataType":"nestedObjectLiteral","nestedProperties":{"liveness":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"faceMatch":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"textDetection":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true}},"required":true},"documentVerifiedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"documentVerified":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}],"required":true},"manualReviewReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"verificationAttempts":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"verificationStatus":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["rejected"]},{"dataType":"enum","enums":["requires_manual_review"]},{"dataType":"enum","enums":[null]}],"required":true},"documentCountry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentNumber":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentType":{"dataType":"union","subSchemas":[{"ref":"DocumentTypeEnum"},{"dataType":"enum","enums":[null]}],"required":true},"lastName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"firstName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetVerificationImageUrlResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"expiresIn":{"dataType":"double","required":true},"url":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApproveVerificationResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApproveVerificationRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"notes":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RejectVerificationResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RejectVerificationRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetVerificationAuditHistoryResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"total":{"dataType":"double","required":true},"offset":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true}},"required":true},"data":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"previousStatus":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"newStatus":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"confidenceScores":{"ref":"JsonValue","required":true},"action":{"dataType":"string","required":true},"userId":{"dataType":"string","required":true},"metadata":{"ref":"JsonValue","required":true},"id":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminEventImage": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
            "imageType": {"dataType":"string","required":true},
            "displayOrder": {"dataType":"double","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminTicketWave": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "faceValue": {"dataType":"string","required":true},
            "currency": {"dataType":"string","required":true},
            "isSoldOut": {"dataType":"boolean","required":true},
            "isAvailable": {"dataType":"boolean","required":true},
            "externalId": {"dataType":"string","required":true},
            "status": {"dataType":"string","required":true},
            "createdAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}]},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"string"}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminEvent": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "eventStartDate": {"dataType":"datetime","required":true},
            "eventEndDate": {"dataType":"datetime","required":true},
            "venueName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "venueAddress": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "venueCity": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "externalUrl": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "platform": {"dataType":"string","required":true},
            "qrAvailabilityTiming": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"dataType":"string","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "images": {"dataType":"array","array":{"dataType":"refObject","ref":"AdminEventImage"},"required":true},
            "ticketWaves": {"dataType":"array","array":{"dataType":"refObject","ref":"AdminTicketWave"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedAdminEventsResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"AdminEvent"},"required":true},
            "pagination": {"dataType":"nestedObjectLiteral","nestedProperties":{"hasPrev":{"dataType":"boolean","required":true},"hasNext":{"dataType":"boolean","required":true},"totalPages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"PaginatedAdminEventsResponse","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofAdminEventsQuerySchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["active"]},{"dataType":"enum","enums":["inactive"]},{"dataType":"undefined"}]},"search":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"includePast":{"dataType":"boolean","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminEventsQuery": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofAdminEventsQuerySchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminEventDetail": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "eventStartDate": {"dataType":"datetime","required":true},
            "eventEndDate": {"dataType":"datetime","required":true},
            "venueName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "venueAddress": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "venueCity": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "externalUrl": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "platform": {"dataType":"string","required":true},
            "qrAvailabilityTiming": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"dataType":"string","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "images": {"dataType":"array","array":{"dataType":"refObject","ref":"AdminEventImage"},"required":true},
            "ticketWaves": {"dataType":"array","array":{"dataType":"refObject","ref":"AdminTicketWave"},"required":true},
            "metadata": {"dataType":"any","required":true},
            "lastScrapedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventDetailsResponse": {
        "dataType": "refAlias",
        "type": {"ref":"AdminEventDetail","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatedEvent": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "eventStartDate": {"dataType":"datetime","required":true},
            "eventEndDate": {"dataType":"datetime","required":true},
            "venueId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "externalUrl": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "platform": {"dataType":"string","required":true},
            "qrAvailabilityTiming": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"dataType":"string","required":true},
            "metadata": {"dataType":"any","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "lastScrapedAt": {"dataType":"datetime","required":true},
            "deletedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateEventResponse": {
        "dataType": "refAlias",
        "type": {"ref":"UpdatedEvent","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateEventRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["active"]},{"dataType":"enum","enums":["inactive"]},{"dataType":"undefined"}]},"qrAvailabilityTiming":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["12h"]},{"dataType":"enum","enums":["24h"]},{"dataType":"enum","enums":["3h"]},{"dataType":"enum","enums":["48h"]},{"dataType":"enum","enums":["6h"]},{"dataType":"enum","enums":["72h"]},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"externalUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"eventEndDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"eventStartDate":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeletedEvent": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "eventStartDate": {"dataType":"datetime","required":true},
            "eventEndDate": {"dataType":"datetime","required":true},
            "venueId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "externalUrl": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "platform": {"dataType":"string","required":true},
            "qrAvailabilityTiming": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"dataType":"string","required":true},
            "metadata": {"dataType":"any","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "lastScrapedAt": {"dataType":"datetime","required":true},
            "deletedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteEventResponse": {
        "dataType": "refAlias",
        "type": {"ref":"DeletedEvent","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatedTicketWave": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "eventId": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "faceValue": {"dataType":"string","required":true},
            "currency": {"dataType":"string","required":true},
            "isSoldOut": {"dataType":"boolean","required":true},
            "isAvailable": {"dataType":"boolean","required":true},
            "status": {"dataType":"string","required":true},
            "metadata": {"dataType":"any","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "lastScrapedAt": {"dataType":"datetime","required":true},
            "deletedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTicketWaveResponse": {
        "dataType": "refAlias",
        "type": {"ref":"CreatedTicketWave","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTicketWaveRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"externalId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"isAvailable":{"dataType":"boolean","required":true},"isSoldOut":{"dataType":"boolean","required":true},"currency":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]}],"required":true},"faceValue":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatedTicketWave": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "eventId": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "faceValue": {"dataType":"string","required":true},
            "currency": {"dataType":"string","required":true},
            "isSoldOut": {"dataType":"boolean","required":true},
            "isAvailable": {"dataType":"boolean","required":true},
            "status": {"dataType":"string","required":true},
            "metadata": {"dataType":"any","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "lastScrapedAt": {"dataType":"datetime","required":true},
            "deletedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTicketWaveResponse": {
        "dataType": "refAlias",
        "type": {"ref":"UpdatedTicketWave","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTicketWaveRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"isAvailable":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"undefined"}]},"isSoldOut":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"undefined"}]},"currency":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]},{"dataType":"undefined"}]},"faceValue":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"undefined"}]},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeletedTicketWave": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "eventId": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "faceValue": {"dataType":"string","required":true},
            "currency": {"dataType":"string","required":true},
            "isSoldOut": {"dataType":"boolean","required":true},
            "isAvailable": {"dataType":"boolean","required":true},
            "status": {"dataType":"string","required":true},
            "metadata": {"dataType":"any","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "lastScrapedAt": {"dataType":"datetime","required":true},
            "deletedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteTicketWaveResponse": {
        "dataType": "refAlias",
        "type": {"ref":"DeletedTicketWave","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadImageResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
            "imageType": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadEventImageResponse": {
        "dataType": "refAlias",
        "type": {"ref":"UploadImageResponse","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteImageResponse": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteEventImageResponse": {
        "dataType": "refAlias",
        "type": {"ref":"DeleteImageResponse","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetCurrentUserResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"rejectionReason":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"canRetryLiveness":{"dataType":"boolean","required":true},"verificationAttempts":{"dataType":"double","required":true},"documentVerificationCompleted":{"dataType":"boolean","required":true},"hasDocumentImage":{"dataType":"boolean","required":true},"verificationSessionId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentCountry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentNumber":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"documentType":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ci_uy"]},{"dataType":"enum","enums":["dni_ar"]},{"dataType":"enum","enums":["passport"]},{"dataType":"enum","enums":[null]}],"required":true},"verificationStatus":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["requires_manual_review"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["rejected"]},{"dataType":"enum","enums":[null]}],"required":true},"documentVerified":{"dataType":"boolean","required":true},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["organizer"]},{"dataType":"enum","enums":["admin"]}],"required":true},"imageUrl":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"lastName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"firstName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DLocalWebhookrRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"payment_id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ClerkWebhookRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"event_attributes":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"http_request":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"user_agent":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"client_ip":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}}},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}}},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"timestamp":{"dataType":"double","required":true},"instance_id":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"reply_to_email_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"email_address_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"user":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"public_metadata_fallback":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"public_metadata":{"dataType":"union","subSchemas":[{"ref":"Record_string.unknown_"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"email_address":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}}},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"theme":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"show_clerk_branding":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"button_text_color":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"primary_color":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}}},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"app":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"logo_url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"logo_image_url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"domain_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}}},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"support_email":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"revoke_session_url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"session_created_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"ip_address":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"location":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"operating_system":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"browser_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"device_type":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"sign_in_method":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"new_email_address":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"primary_email_address":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"greeting_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"invitation":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"public_metadata_fallback":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"public_metadata":{"dataType":"union","subSchemas":[{"ref":"Record_string.unknown_"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"expires_in_days":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}}},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"action_url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"inviter_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"requested_by":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"requested_from":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"requested_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"otp_code":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}},"required":true},"from_email_name":{"dataType":"string","required":true},"delivered_by_clerk":{"dataType":"boolean","required":true},"status":{"dataType":"string","required":true},"slug":{"dataType":"string","required":true},"body_plain":{"dataType":"string","required":true},"body":{"dataType":"string","required":true},"subject":{"dataType":"string","required":true},"to_email_address":{"dataType":"string","required":true},"object":{"dataType":"enum","enums":["email"],"required":true},"id":{"dataType":"string","required":true}},"required":true},"type":{"dataType":"enum","enums":["email.created"],"required":true},"object":{"dataType":"enum","enums":["event"],"required":true}},"validators":{}},
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"deletedAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"string","required":true},"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["seen"]},{"dataType":"enum","enums":["sent"]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"channels":{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["email"]},{"dataType":"enum","enums":["in_app"]},{"dataType":"enum","enums":["sms"]}]},"required":true},"userId":{"dataType":"string","required":true},"channelStatus":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"ref":"JsonArray"},{"ref":"JsonObject"},{"dataType":"enum","enums":[null]}],"required":true},"retryCount":{"dataType":"double","required":true},"seenAt":{"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},"sendViaJob":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_Notification.metadata-or-actions-or-type-or-title-or-description_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_Notification.Exclude_keyofNotification.metadata-or-actions-or-type-or-title-or-description__","validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["auth_invitation"]},{"dataType":"enum","enums":["auth_new_device_sign_in"]},{"dataType":"enum","enums":["auth_password_changed"]},{"dataType":"enum","enums":["auth_password_removed"]},{"dataType":"enum","enums":["auth_primary_email_changed"]},{"dataType":"enum","enums":["auth_reset_password_code"]},{"dataType":"enum","enums":["auth_verification_code"]},{"dataType":"enum","enums":["buyer_ticket_cancelled"]},{"dataType":"enum","enums":["document_reminder"]},{"dataType":"enum","enums":["document_uploaded"]},{"dataType":"enum","enums":["document_uploaded_batch"]},{"dataType":"enum","enums":["identity_verification_completed"]},{"dataType":"enum","enums":["identity_verification_failed"]},{"dataType":"enum","enums":["identity_verification_manual_review"]},{"dataType":"enum","enums":["identity_verification_rejected"]},{"dataType":"enum","enums":["order_confirmed"]},{"dataType":"enum","enums":["order_expired"]},{"dataType":"enum","enums":["order_invoice"]},{"dataType":"enum","enums":["payment_failed"]},{"dataType":"enum","enums":["payment_succeeded"]},{"dataType":"enum","enums":["payout_cancelled"]},{"dataType":"enum","enums":["payout_completed"]},{"dataType":"enum","enums":["payout_failed"]},{"dataType":"enum","enums":["payout_processing"]},{"dataType":"enum","enums":["seller_earnings_retained"]},{"dataType":"enum","enums":["ticket_sold_seller"]}],"validators":{}},
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
    "infer_typeofBaseActionSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"union","subSchemas":[{"ref":"Record_string.unknown_"},{"dataType":"undefined"}]},"url":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"label":{"dataType":"string","required":true},"type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["upload_documents"]},{"dataType":"enum","enums":["view_order"]},{"dataType":"enum","enums":["retry_payment"]},{"dataType":"enum","enums":["view_payout"]},{"dataType":"enum","enums":["start_verification"]},{"dataType":"enum","enums":["publish_tickets"]},{"dataType":"enum","enums":["view_earnings"]}],"required":true}},"validators":{}},
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
    "InitiateVerificationResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorClassName": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["AppError"]},{"dataType":"enum","enums":["BadRequestError"]},{"dataType":"enum","enums":["UnauthorizedError"]},{"dataType":"enum","enums":["ForbiddenError"]},{"dataType":"enum","enums":["NotFoundError"]},{"dataType":"enum","enums":["ConflictError"]},{"dataType":"enum","enums":["ValidationError"]},{"dataType":"enum","enums":["TooManyRequestsError"]},{"dataType":"enum","enums":["MaxAttemptsExceededError"]},{"dataType":"enum","enums":["InternalServerError"]},{"dataType":"enum","enums":["ServiceUnavailableError"]},{"dataType":"enum","enums":["DatabaseError"]},{"dataType":"enum","enums":["ZodValidationError"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "error": {"ref":"ErrorClassName","required":true},
            "message": {"dataType":"string","required":true},
            "statusCode": {"dataType":"double","required":true},
            "timestamp": {"dataType":"string","required":true},
            "path": {"dataType":"string","required":true},
            "method": {"dataType":"string","required":true},
            "metadata": {"ref":"Record_string.unknown_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InitiateVerificationRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"documentCountry":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"documentNumber":{"dataType":"string","required":true},"documentType":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ci_uy"]},{"dataType":"enum","enums":["dni_ar"]},{"dataType":"enum","enums":["passport"]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProcessDocumentResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"documentIdMatch":{"dataType":"boolean","required":true},"verificationStatus":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["requires_manual_review"]}],"required":true},"readyForLiveness":{"dataType":"boolean","required":true},"extractedDocumentId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateLivenessCheckResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"attemptsRemaining":{"dataType":"double","required":true},"expiresInSeconds":{"dataType":"double","required":true},"region":{"dataType":"string","required":true},"sessionId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerificationStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["requires_manual_review"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerifyLivenessResultsResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"retriesRemaining":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"undefined"}]},"canRetry":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"undefined"}]},"message":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"status":{"ref":"VerificationStatus","required":true},"verified":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerifyLivenessRouteBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"sessionId":{"dataType":"string","required":true}},"validators":{}},
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
                query: {"in":"queries","name":"query","required":true,"ref":"EventsPaginatedQuery"},
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
        const argsEventsController_getTrendingEvents: Record<string, TsoaRoute.ParameterSchema> = {
                days: {"in":"query","name":"days","dataType":"double"},
                limit: {"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/events/trending',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getTrendingEvents)),

            async function EventsController_getTrendingEvents(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_getTrendingEvents, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'getTrendingEvents',
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
        const argsEventsController_getDistinctCities: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/events/cities',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getDistinctCities)),

            async function EventsController_getDistinctCities(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_getDistinctCities, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'getDistinctCities',
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
        const argsEventsController_trackView: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
        };
        app.post('/events/:eventId/view',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.trackView)),

            async function EventsController_trackView(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_trackView, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'trackView',
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
        const argsTicketListingsController_updateTicketPrice: Record<string, TsoaRoute.ParameterSchema> = {
                ticketId: {"in":"path","name":"ticketId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateTicketPriceRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/ticket-listings/tickets/:ticketId/price',
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.updateTicketPrice)),

            async function TicketListingsController_updateTicketPrice(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_updateTicketPrice, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'updateTicketPrice',
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
        const argsTicketListingsController_removeTicket: Record<string, TsoaRoute.ParameterSchema> = {
                ticketId: {"in":"path","name":"ticketId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/ticket-listings/tickets/:ticketId',
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.removeTicket)),

            async function TicketListingsController_removeTicket(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_removeTicket, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'removeTicket',
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
        const argsTicketListingsController_getTicketInfo: Record<string, TsoaRoute.ParameterSchema> = {
                ticketId: {"in":"path","name":"ticketId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/ticket-listings/tickets/:ticketId/info',
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController)),
            ...(fetchMiddlewares<RequestHandler>(TicketListingsController.prototype.getTicketInfo)),

            async function TicketListingsController_getTicketInfo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTicketListingsController_getTicketInfo, request, response });

                const controller = new TicketListingsController();

              await templateService.apiHandler({
                methodName: 'getTicketInfo',
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
        const argsOrdersController_cancelOrder: Record<string, TsoaRoute.ParameterSchema> = {
                orderId: {"in":"path","name":"orderId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/orders/:orderId/cancel',
            ...(fetchMiddlewares<RequestHandler>(OrdersController)),
            ...(fetchMiddlewares<RequestHandler>(OrdersController.prototype.cancelOrder)),

            async function OrdersController_cancelOrder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrdersController_cancelOrder, request, response });

                const controller = new OrdersController();

              await templateService.apiHandler({
                methodName: 'cancelOrder',
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
        const argsPayoutsController_getPayoutDetails: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/payouts/:payoutId',
            ...(fetchMiddlewares<RequestHandler>(PayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(PayoutsController.prototype.getPayoutDetails)),

            async function PayoutsController_getPayoutDetails(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPayoutsController_getPayoutDetails, request, response });

                const controller = new PayoutsController();

              await templateService.apiHandler({
                methodName: 'getPayoutDetails',
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
        const argsAdminPayoutsController_getPayouts: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"undefined"}]},"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/admin/payouts',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.getPayouts)),

            async function AdminPayoutsController_getPayouts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_getPayouts, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'getPayouts',
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
        const argsAdminPayoutsController_getPayoutDetails: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/admin/payouts/:payoutId',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.getPayoutDetails)),

            async function AdminPayoutsController_getPayoutDetails(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_getPayoutDetails, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'getPayoutDetails',
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
        const argsAdminPayoutsController_processPayout: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ProcessPayoutRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/payouts/:payoutId/process',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.processPayout)),

            async function AdminPayoutsController_processPayout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_processPayout, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'processPayout',
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
        const argsAdminPayoutsController_completePayout: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CompletePayoutRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/payouts/:payoutId/complete',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.completePayout)),

            async function AdminPayoutsController_completePayout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_completePayout, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'completePayout',
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
        const argsAdminPayoutsController_failPayout: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"FailPayoutRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/payouts/:payoutId/fail',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.failPayout)),

            async function AdminPayoutsController_failPayout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_failPayout, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'failPayout',
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
        const argsAdminPayoutsController_updatePayout: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdatePayoutRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/admin/payouts/:payoutId',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.updatePayout)),

            async function AdminPayoutsController_updatePayout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_updatePayout, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'updatePayout',
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
        const argsAdminPayoutsController_cancelPayout: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CancelPayoutRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/payouts/:payoutId/cancel',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.cancelPayout)),

            async function AdminPayoutsController_cancelPayout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_cancelPayout, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'cancelPayout',
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
        const argsAdminPayoutsController_uploadPayoutDocument: Record<string, TsoaRoute.ParameterSchema> = {
                payoutId: {"in":"path","name":"payoutId","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/payouts/:payoutId/documents',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.uploadPayoutDocument)),

            async function AdminPayoutsController_uploadPayoutDocument(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_uploadPayoutDocument, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'uploadPayoutDocument',
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
        const argsAdminPayoutsController_deletePayoutDocument: Record<string, TsoaRoute.ParameterSchema> = {
                documentId: {"in":"path","name":"documentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/admin/payouts/documents/:documentId',
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminPayoutsController.prototype.deletePayoutDocument)),

            async function AdminPayoutsController_deletePayoutDocument(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminPayoutsController_deletePayoutDocument, request, response });

                const controller = new AdminPayoutsController();

              await templateService.apiHandler({
                methodName: 'deletePayoutDocument',
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
        const argsAdminIdentityVerificationController_getVerifications: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["rejected"]},{"dataType":"enum","enums":["requires_manual_review"]},{"dataType":"undefined"}]},"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["updatedAt"]},{"dataType":"enum","enums":["verificationAttempts"]}],"required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/admin/identity-verification',
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController.prototype.getVerifications)),

            async function AdminIdentityVerificationController_getVerifications(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminIdentityVerificationController_getVerifications, request, response });

                const controller = new AdminIdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'getVerifications',
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
        const argsAdminIdentityVerificationController_getVerificationDetails: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
        };
        app.get('/admin/identity-verification/:userId',
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController.prototype.getVerificationDetails)),

            async function AdminIdentityVerificationController_getVerificationDetails(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminIdentityVerificationController_getVerificationDetails, request, response });

                const controller = new AdminIdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'getVerificationDetails',
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
        const argsAdminIdentityVerificationController_getVerificationImage: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                imageType: {"in":"path","name":"imageType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["document"]},{"dataType":"enum","enums":["reference"]},{"dataType":"enum","enums":["audit"]}]},
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"index":{"dataType":"string"}}},
        };
        app.get('/admin/identity-verification/:userId/images/:imageType',
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController.prototype.getVerificationImage)),

            async function AdminIdentityVerificationController_getVerificationImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminIdentityVerificationController_getVerificationImage, request, response });

                const controller = new AdminIdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'getVerificationImage',
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
        const argsAdminIdentityVerificationController_approveVerification: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ApproveVerificationRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/identity-verification/:userId/approve',
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController.prototype.approveVerification)),

            async function AdminIdentityVerificationController_approveVerification(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminIdentityVerificationController_approveVerification, request, response });

                const controller = new AdminIdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'approveVerification',
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
        const argsAdminIdentityVerificationController_rejectVerification: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"RejectVerificationRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/admin/identity-verification/:userId/reject',
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController.prototype.rejectVerification)),

            async function AdminIdentityVerificationController_rejectVerification(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminIdentityVerificationController_rejectVerification, request, response });

                const controller = new AdminIdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'rejectVerification',
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
        const argsAdminIdentityVerificationController_getVerificationAuditHistory: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"offset":{"dataType":"string"},"limit":{"dataType":"string"}}},
        };
        app.get('/admin/identity-verification/:userId/audit-history',
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(AdminIdentityVerificationController.prototype.getVerificationAuditHistory)),

            async function AdminIdentityVerificationController_getVerificationAuditHistory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminIdentityVerificationController_getVerificationAuditHistory, request, response });

                const controller = new AdminIdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'getVerificationAuditHistory',
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
        const argsAdminEventsController_getEvents: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["active"]},{"dataType":"enum","enums":["inactive"]},{"dataType":"undefined"}]},"search":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"includePast":{"dataType":"boolean","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/admin/events',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.getEvents)),

            async function AdminEventsController_getEvents(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_getEvents, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'getEvents',
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
        const argsAdminEventsController_getEventDetails: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
        };
        app.get('/admin/events/:eventId',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.getEventDetails)),

            async function AdminEventsController_getEventDetails(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_getEventDetails, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'getEventDetails',
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
        const argsAdminEventsController_updateEvent: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateEventRouteBody"},
        };
        app.put('/admin/events/:eventId',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.updateEvent)),

            async function AdminEventsController_updateEvent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_updateEvent, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'updateEvent',
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
        const argsAdminEventsController_deleteEvent: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
        };
        app.delete('/admin/events/:eventId',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.deleteEvent)),

            async function AdminEventsController_deleteEvent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_deleteEvent, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'deleteEvent',
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
        const argsAdminEventsController_createTicketWave: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateTicketWaveRouteBody"},
        };
        app.post('/admin/events/:eventId/ticket-waves',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.createTicketWave)),

            async function AdminEventsController_createTicketWave(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_createTicketWave, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'createTicketWave',
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
        const argsAdminEventsController_updateTicketWave: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                waveId: {"in":"path","name":"waveId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateTicketWaveRouteBody"},
        };
        app.put('/admin/events/:eventId/ticket-waves/:waveId',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.updateTicketWave)),

            async function AdminEventsController_updateTicketWave(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_updateTicketWave, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'updateTicketWave',
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
        const argsAdminEventsController_deleteTicketWave: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                waveId: {"in":"path","name":"waveId","required":true,"dataType":"string"},
        };
        app.delete('/admin/events/:eventId/ticket-waves/:waveId',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.deleteTicketWave)),

            async function AdminEventsController_deleteTicketWave(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_deleteTicketWave, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'deleteTicketWave',
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
        const argsAdminEventsController_uploadEventImage: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                imageType: {"in":"formData","name":"imageType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["flyer"]},{"dataType":"enum","enums":["hero"]}]},
        };
        app.post('/admin/events/:eventId/images',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.uploadEventImage)),

            async function AdminEventsController_uploadEventImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_uploadEventImage, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'uploadEventImage',
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
        const argsAdminEventsController_deleteEventImage: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
                imageId: {"in":"path","name":"imageId","required":true,"dataType":"string"},
        };
        app.delete('/admin/events/:eventId/images/:imageId',
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEventsController.prototype.deleteEventImage)),

            async function AdminEventsController_deleteEventImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEventsController_deleteEventImage, request, response });

                const controller = new AdminEventsController();

              await templateService.apiHandler({
                methodName: 'deleteEventImage',
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
        const argsUsersController_getCurrentUser: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/users/me',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getCurrentUser)),

            async function UsersController_getCurrentUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getCurrentUser, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getCurrentUser',
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
        const argsWebhooksController_handleClerkWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"ClerkWebhookRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/webhooks/clerk',
            ...(fetchMiddlewares<RequestHandler>(WebhooksController)),
            ...(fetchMiddlewares<RequestHandler>(WebhooksController.prototype.handleClerkWebhook)),

            async function WebhooksController_handleClerkWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWebhooksController_handleClerkWebhook, request, response });

                const controller = new WebhooksController();

              await templateService.apiHandler({
                methodName: 'handleClerkWebhook',
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
        const argsIdentityVerificationController_initiateVerification: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"InitiateVerificationRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/identity-verification/initiate',
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController.prototype.initiateVerification)),

            async function IdentityVerificationController_initiateVerification(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIdentityVerificationController_initiateVerification, request, response });

                const controller = new IdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'initiateVerification',
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
        const argsIdentityVerificationController_verifyDocument: Record<string, TsoaRoute.ParameterSchema> = {
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                documentType: {"in":"formData","name":"documentType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ci_uy"]},{"dataType":"enum","enums":["dni_ar"]},{"dataType":"enum","enums":["passport"]}]},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/identity-verification/verify-document',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController.prototype.verifyDocument)),

            async function IdentityVerificationController_verifyDocument(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIdentityVerificationController_verifyDocument, request, response });

                const controller = new IdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'verifyDocument',
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
        const argsIdentityVerificationController_startLiveness: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/identity-verification/start-liveness',
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController.prototype.startLiveness)),

            async function IdentityVerificationController_startLiveness(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIdentityVerificationController_startLiveness, request, response });

                const controller = new IdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'startLiveness',
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
        const argsIdentityVerificationController_verifyLiveness: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"VerifyLivenessRouteBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/identity-verification/verify-liveness',
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController.prototype.verifyLiveness)),

            async function IdentityVerificationController_verifyLiveness(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIdentityVerificationController_verifyLiveness, request, response });

                const controller = new IdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'verifyLiveness',
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
        const argsIdentityVerificationController_getLivenessCredentials: Record<string, TsoaRoute.ParameterSchema> = {
                _request: {"in":"request","name":"_request","required":true,"dataType":"object"},
        };
        app.get('/identity-verification/liveness-credentials',
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController)),
            ...(fetchMiddlewares<RequestHandler>(IdentityVerificationController.prototype.getLivenessCredentials)),

            async function IdentityVerificationController_getLivenessCredentials(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with @mathfalcon/tsoa. Please do not modify it. Re-run @mathfalcon/tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIdentityVerificationController_getLivenessCredentials, request, response });

                const controller = new IdentityVerificationController();

              await templateService.apiHandler({
                methodName: 'getLivenessCredentials',
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
