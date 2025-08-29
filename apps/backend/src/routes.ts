/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EventsController } from './controllers/events/index';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './controllers/health/index';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "EventImageType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["flyer"]},{"dataType":"enum","enums":["hero"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
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
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedResponse__createdAt-Date--description-string-or-null--eventEndDate-Date--eventStartDate-Date--externalUrl-string--id-string--name-string--status-string--updatedAt-Date--venueAddress-string--venueName-string-or-null--images_58__url-string--imageType-EventImageType_-Array__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventsPaginatedResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"images":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},"venueName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"venueAddress":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"status":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"externalUrl":{"dataType":"string","required":true},"eventStartDate":{"dataType":"datetime","required":true},"eventEndDate":{"dataType":"datetime","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"createdAt":{"dataType":"datetime","required":true}}},"required":true},
            "pagination": {"ref":"PaginationMeta","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "infer_typeofPaginationSchema_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationQuery": {
        "dataType": "refAlias",
        "type": {"ref":"infer_typeofPaginationSchema_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserPublicMetadata": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserPrivateMetadata": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserUnsafeMetadata": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerificationStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["unverified"]},{"dataType":"enum","enums":["verified"]},{"dataType":"enum","enums":["transferable"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["expired"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "url.URL": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Verification": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"VerificationStatus","required":true},
            "strategy": {"dataType":"string","required":true},
            "externalVerificationRedirectURL": {"dataType":"union","subSchemas":[{"ref":"url.URL"},{"dataType":"enum","enums":[null]}],"required":true},
            "attempts": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "expireAt": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "nonce": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "message": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IdentificationLink": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EmailAddress": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "emailAddress": {"dataType":"string","required":true},
            "verification": {"dataType":"union","subSchemas":[{"ref":"Verification"},{"dataType":"enum","enums":[null]}],"required":true},
            "linkedTo": {"dataType":"array","array":{"dataType":"refObject","ref":"IdentificationLink"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PhoneNumber": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "phoneNumber": {"dataType":"string","required":true},
            "reservedForSecondFactor": {"dataType":"boolean","required":true},
            "defaultSecondFactor": {"dataType":"boolean","required":true},
            "verification": {"dataType":"union","subSchemas":[{"ref":"Verification"},{"dataType":"enum","enums":[null]}],"required":true},
            "linkedTo": {"dataType":"array","array":{"dataType":"refObject","ref":"IdentificationLink"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Web3Wallet": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "web3Wallet": {"dataType":"string","required":true},
            "verification": {"dataType":"union","subSchemas":[{"ref":"Verification"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExternalAccount": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "provider": {"dataType":"string","required":true},
            "identificationId": {"dataType":"string","required":true},
            "externalId": {"dataType":"string","required":true},
            "approvedScopes": {"dataType":"string","required":true},
            "emailAddress": {"dataType":"string","required":true},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "imageUrl": {"dataType":"string","required":true},
            "username": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "phoneNumber": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "publicMetadata": {"dataType":"union","subSchemas":[{"ref":"Record_string.unknown_"},{"dataType":"enum","enums":[null]}],"required":true},
            "label": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "verification": {"dataType":"union","subSchemas":[{"ref":"Verification"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SamlAccountConnection": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "domain": {"dataType":"string","required":true},
            "active": {"dataType":"boolean","required":true},
            "provider": {"dataType":"string","required":true},
            "syncUserAttributes": {"dataType":"boolean","required":true},
            "allowSubdomains": {"dataType":"boolean","required":true},
            "allowIdpInitiated": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"double","required":true},
            "updatedAt": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SamlAccount": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "provider": {"dataType":"string","required":true},
            "providerUserId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "active": {"dataType":"boolean","required":true},
            "emailAddress": {"dataType":"string","required":true},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "verification": {"dataType":"union","subSchemas":[{"ref":"Verification"},{"dataType":"enum","enums":[null]}],"required":true},
            "samlConnection": {"dataType":"union","subSchemas":[{"ref":"SamlAccountConnection"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "User": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "passwordEnabled": {"dataType":"boolean","required":true},
            "totpEnabled": {"dataType":"boolean","required":true},
            "backupCodeEnabled": {"dataType":"boolean","required":true},
            "twoFactorEnabled": {"dataType":"boolean","required":true},
            "banned": {"dataType":"boolean","required":true},
            "locked": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"double","required":true},
            "updatedAt": {"dataType":"double","required":true},
            "imageUrl": {"dataType":"string","required":true},
            "hasImage": {"dataType":"boolean","required":true},
            "primaryEmailAddressId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "primaryPhoneNumberId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "primaryWeb3WalletId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "lastSignInAt": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "externalId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "username": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "firstName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "lastName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "publicMetadata": {"ref":"UserPublicMetadata","required":true},
            "privateMetadata": {"ref":"UserPrivateMetadata","required":true},
            "unsafeMetadata": {"ref":"UserUnsafeMetadata","required":true},
            "emailAddresses": {"dataType":"array","array":{"dataType":"refObject","ref":"EmailAddress"},"required":true},
            "phoneNumbers": {"dataType":"array","array":{"dataType":"refObject","ref":"PhoneNumber"},"required":true},
            "web3Wallets": {"dataType":"array","array":{"dataType":"refObject","ref":"Web3Wallet"},"required":true},
            "externalAccounts": {"dataType":"array","array":{"dataType":"refObject","ref":"ExternalAccount"},"required":true},
            "samlAccounts": {"dataType":"array","array":{"dataType":"refObject","ref":"SamlAccount"},"required":true},
            "lastActiveAt": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "createOrganizationEnabled": {"dataType":"boolean","required":true},
            "createOrganizationsLimit": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "deleteSelfEnabled": {"dataType":"boolean","required":true},
            "legalAcceptedAt": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EventTicketCurrency": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USD"]},{"dataType":"enum","enums":["UYU"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetEventByIdResponse": {
        "dataType": "refObject",
        "properties": {
            "ticketWaves": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"isSoldOut":{"dataType":"boolean","required":true},"isAvailable":{"dataType":"boolean","required":true},"faceValue":{"dataType":"string","required":true},"currency":{"ref":"EventTicketCurrency","required":true},"name":{"dataType":"string","required":true},"description":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},
            "eventImages": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"imageType":{"ref":"EventImageType","required":true},"url":{"dataType":"string","required":true}}},"required":true},
            "venueName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "venueAddress": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "status": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "id": {"dataType":"string","required":true},
            "externalUrl": {"dataType":"string","required":true},
            "eventStartDate": {"dataType":"datetime","required":true},
            "eventEndDate": {"dataType":"datetime","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
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
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
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
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"silently-remove-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsEventsController_getAllPaginated: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"queries","name":"query","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sortOrder":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]},{"dataType":"undefined"}]},"sortBy":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/events',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getAllPaginated)),

            async function EventsController_getAllPaginated(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventsController_getProtected: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/events/protected',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getProtected)),

            async function EventsController_getProtected(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEventsController_getProtected, request, response });

                const controller = new EventsController();

              await templateService.apiHandler({
                methodName: 'getProtected',
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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEventsController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                eventId: {"in":"path","name":"eventId","required":true,"dataType":"string"},
        };
        app.get('/events/:eventId',
            ...(fetchMiddlewares<RequestHandler>(EventsController)),
            ...(fetchMiddlewares<RequestHandler>(EventsController.prototype.getById)),

            async function EventsController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_basic: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.basic)),

            async function HealthController_basic(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_detailed: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/detailed',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.detailed)),

            async function HealthController_detailed(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_database: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/database',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.database)),

            async function HealthController_database(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_memory: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/memory',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.memory)),

            async function HealthController_memory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_readiness: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/ready',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.readiness)),

            async function HealthController_readiness(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_liveness: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health/live',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.liveness)),

            async function HealthController_liveness(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

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
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
