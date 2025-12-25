/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum NotificationType {
  DocumentReminder = "document_reminder",
  DocumentUploaded = "document_uploaded",
  OrderConfirmed = "order_confirmed",
  OrderExpired = "order_expired",
  PaymentFailed = "payment_failed",
  PaymentSucceeded = "payment_succeeded",
  TicketSoldSeller = "ticket_sold_seller",
}

export enum PayoutType {
  Paypal = "paypal",
  UruguayanBank = "uruguayan_bank",
}

export enum UploadAvailabilityReason {
  EventEnded = "event_ended",
  TooEarly = "too_early",
  Unknown = "unknown",
}

export enum EventTicketCurrency {
  USD = "USD",
  UYU = "UYU",
}

export enum EventImageType {
  Flyer = "flyer",
  Hero = "hero",
}

export interface PaginationMeta {
  /** @format double */
  page: number;
  /** @format double */
  limit: number;
  /** @format double */
  total: number;
  /** @format double */
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponseCreatedAtDateDescriptionStringOrNullEventEndDateDateEventStartDateDateExternalUrlStringIdStringNameStringStatusStringUpdatedAtDateVenueAddressStringVenueNameStringOrNullLowestAvailableTicketPriceNumberOrNullLowestAvailableTicketCurrencyStringOrNullImages58UrlStringImageTypeEventImageTypeArray {
  data: {
    images: {
      imageType: EventImageType;
      url: string;
    }[];
    lowestAvailableTicketCurrency: string | null;
    /** @format double */
    lowestAvailableTicketPrice: number | null;
    venueName: string | null;
    venueAddress: string;
    /** @format date-time */
    updatedAt: string;
    status: string;
    name: string;
    id: string;
    externalUrl: string;
    /** @format date-time */
    eventStartDate: string;
    /** @format date-time */
    eventEndDate: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
  }[];
  pagination: PaginationMeta;
}

export type GetEventsPaginatedResponse =
  PaginatedResponseCreatedAtDateDescriptionStringOrNullEventEndDateDateEventStartDateDateExternalUrlStringIdStringNameStringStatusStringUpdatedAtDateVenueAddressStringVenueNameStringOrNullLowestAvailableTicketPriceNumberOrNullLowestAvailableTicketCurrencyStringOrNullImages58UrlStringImageTypeEventImageTypeArray;

export interface InferTypeofPaginationSchema {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type PaginationQuery = InferTypeofPaginationSchema;

export type SearchEventsResponse = {
  eventImages: {
    imageType: EventImageType;
    url: string;
  }[];
  venueName: string | null;
  venueAddress: string;
  /** @format date-time */
  updatedAt: string;
  status: string;
  name: string;
  id: string;
  externalUrl: string;
  /** @format date-time */
  eventStartDate: string;
  /** @format date-time */
  eventEndDate: string;
  description: string | null;
  /** @format date-time */
  createdAt: string;
}[];

export interface GetEventByIdResponse {
  ticketWaves: {
    priceGroups: {
      availableTickets: string | number;
      price: string;
    }[];
    faceValue: string;
    currency: EventTicketCurrency;
    name: string;
    id: string;
    description: string | null;
  }[];
  eventImages: {
    imageType: EventImageType;
    url: string;
  }[];
  venueName: string | null;
  venueAddress: string;
  /** @format date-time */
  updatedAt: string;
  status: string;
  name: string;
  id: string;
  externalUrl: string;
  /** @format date-time */
  eventStartDate: string;
  /** @format date-time */
  eventEndDate: string;
  description: string | null;
  /** @format date-time */
  createdAt: string;
}

/** Construct a type with a set of properties K of type T */
export type RecordStringAny = Record<string, any>;

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  /** @format double */
  responseTime?: number;
  /** Construct a type with a set of properties K of type T */
  details?: RecordStringAny;
}

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  /** @format double */
  uptime: number;
  version: string;
  checks: {
    external?: HealthCheckResult;
    disk: HealthCheckResult;
    memory: HealthCheckResult;
    database?: HealthCheckResult;
  };
}

export interface CreateTicketListingResponse {
  ticketWaveId: string;
  /** @format date-time */
  soldAt: string | null;
  publisherUserId: string;
  /** @format date-time */
  updatedAt: string;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
  listingTickets: {
    /** @format double */
    ticketNumber: number;
    price: string;
    listingId: string;
    /** @format date-time */
    cancelledAt: string | null;
    /** @format date-time */
    soldAt: string | null;
    /** @format date-time */
    updatedAt: string;
    id: string;
    /** @format date-time */
    deletedAt: string | null;
    /** @format date-time */
    createdAt: string;
  }[];
}

export interface UnauthorizedError {
  name: string;
  message: string;
  stack?: string;
  /** @format double */
  statusCode: number;
  isOperational: boolean;
}

export interface BadRequestError {
  name: string;
  message: string;
  stack?: string;
  /** @format double */
  statusCode: number;
  isOperational: boolean;
}

export interface NotFoundError {
  name: string;
  message: string;
  stack?: string;
  /** @format double */
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  name: string;
  message: string;
  stack?: string;
  /** @format double */
  statusCode: number;
  isOperational: boolean;
  /** Construct a type with a set of properties K of type T */
  metadata?: RecordStringAny;
}

export interface CreateTicketListingRouteBody {
  /** @format double */
  quantity: number;
  /** @format double */
  price: number;
  ticketWaveId: string;
  eventId: string;
}

export type GetUserListingsResponse = {
  event: {
    venueName: string | null;
    venueAddress: string;
    platform: string;
    name: string;
    id: string;
    eventStartDate: string;
    eventEndDate: string;
    description: string | null;
  };
  ticketWave: {
    currency: EventTicketCurrency;
    name: string;
    id: string;
  };
  /** @format date-time */
  soldAt: string | null;
  /** @format date-time */
  updatedAt: string;
  id: string;
  /** @format date-time */
  createdAt: string;
  tickets: {
    document: {
      uploadedAt: string;
      status: string;
      id: string;
    } | null;
    /** @format double */
    ticketNumber: number;
    price: string;
    cancelledAt: string | null;
    soldAt: string | null;
    updatedAt: string;
    id: string;
    createdAt: string;
    uploadUnavailableReason?: UploadAvailabilityReason;
    canUploadDocument: boolean;
    hasDocument: boolean;
  }[];
}[];

export interface UploadDocumentResponse {
  documentUrl: string;
  document?: {
    /** @format double */
    version: number;
    verifiedBy: string | null;
    /** @format date-time */
    verifiedAt: string | null;
    /** @format date-time */
    uploadedAt: string;
    ticketId: string;
    storagePath: string;
    /** @format double */
    sizeBytes: number;
    originalName: string;
    mimeType: string;
    isPrimary: boolean;
    fileName: string;
    documentType: string;
    /** @format date-time */
    updatedAt: string;
    status: string;
    id: string;
    /** @format date-time */
    deletedAt: string | null;
    /** @format date-time */
    createdAt: string;
  };
}

export interface CreateOrderResponse {
  vatOnCommission: string;
  totalAmount: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
  userId: string;
  /** @format date-time */
  cancelledAt: string | null;
  currency: EventTicketCurrency;
  eventId: string;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "confirmed" | "expired" | "pending";
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

/** Construct a type with a set of properties K of type T */
export type RecordStringRecordStringNumber = object;

export interface CreateOrderRouteBody {
  /** Construct a type with a set of properties K of type T */
  ticketSelections: RecordStringRecordStringNumber;
  eventId: string;
}

export interface GetOrderByIdResponse {
  items: {
    ticketWaveName: string | null;
    subtotal: string | null;
    /** @format double */
    quantity: number | null;
    pricePerTicket: string | null;
    ticketWaveId: string | null;
    id: string | null;
    currency: EventTicketCurrency | null;
  }[];
  event: {
    images: {
      imageType: EventImageType;
      url: string;
    }[];
    venueName: string | null;
    venueAddress: string | null;
    platform: string | null;
    name: string | null;
    id: string | null;
    eventStartDate: string | null;
    eventEndDate: string | null;
  };
  vatOnCommission: string;
  totalAmount: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
  userId: string;
  /** @format date-time */
  cancelledAt: string | null;
  currency: EventTicketCurrency;
  eventId: string;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "confirmed" | "expired" | "pending";
  id: string;
  /** @format date-time */
  createdAt: string;
}

export type GetUserOrdersResponse = {
  items: {
    ticketWaveName: string | null;
    subtotal: string;
    /** @format double */
    quantity: number;
    pricePerTicket: string;
    ticketWaveId: string;
    id: string;
    currency: EventTicketCurrency | null;
  }[];
  event: {
    images: {
      imageType: EventImageType;
      url: string;
    }[];
    venueName: string | null;
    venueAddress: string | null;
    platform: string | null;
    name: string | null;
    id: string | null;
    eventStartDate: string | null;
    eventEndDate: string | null;
  };
  vatOnCommission: string;
  totalAmount: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
  userId: string;
  /** @format date-time */
  cancelledAt: string | null;
  currency: EventTicketCurrency;
  eventId: string;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "confirmed" | "expired" | "pending";
  id: string;
  /** @format date-time */
  createdAt: string;
}[];

export interface GetOrderTicketsResponse {
  tickets: {
    document: {
      url: string;
      mimeType: string | null;
      uploadedAt: string | null;
      status: string | null;
      id: string | null;
    };
    ticketWave: {
      name: string;
    } | null;
    hasDocument: boolean;
    /** @format date-time */
    soldAt: string | null;
    price: string;
    id: string;
  }[];
  currency: EventTicketCurrency;
  vatOnCommission: string;
  platformCommission: string;
  totalAmount: string;
  subtotalAmount: string;
  event: {
    eventStartDate: string | null;
    name: string | null;
  };
  orderId: string;
}

export interface BalanceByCurrency {
  currency: EventTicketCurrency;
  amount: string;
  /** @format double */
  count: number;
}

export interface SellerBalance {
  available: BalanceByCurrency[];
  retained: BalanceByCurrency[];
  pending: BalanceByCurrency[];
  total: BalanceByCurrency[];
}

export type GetBalanceResponse = SellerBalance;

export interface EarningsForSelection {
  byListing: {
    currency: EventTicketCurrency;
    /** @format double */
    ticketCount: number;
    totalAmount: string;
    publisherUserId: string;
    listingId: string;
  }[];
  byTicket: {
    publisherUserId: string;
    listingId: string;
    /** @format date-time */
    holdUntil: string;
    currency: EventTicketCurrency;
    sellerAmount: string;
    listingTicketId: string;
    id: string;
  }[];
}

export type GetAvailableEarningsResponse = EarningsForSelection;

export interface GetPayoutHistoryResponse {
  pagination: PaginationMeta;
  data: {
    linkedEarnings: {
      createdAt: string;
      currency: EventTicketCurrency;
      sellerAmount: string;
      listingTicketId: string;
      id: string;
    }[];
    /** @format date-time */
    completedAt: string | null;
    /** @format date-time */
    processedAt: string | null;
    /** @format date-time */
    requestedAt: string;
    currency: EventTicketCurrency;
    amount: string;
    status: "cancelled" | "pending" | "completed" | "failed" | "processing";
    id: string;
  }[];
}

export type JsonArray = JsonValue[];

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type JsonObject = Record<string, JsonValue>;

export type JsonPrimitive = boolean | number | string | null;

export interface RequestPayoutResponse {
  transactionReference: string | null;
  sellerUserId: string;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  /** @format date-time */
  completedAt: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  currency: EventTicketCurrency;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "pending" | "completed" | "failed" | "processing";
  metadata: string | number | boolean | JsonArray | JsonObject | null;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface RequestPayoutRouteBody {
  listingIds?: string[];
  listingTicketIds?: string[];
  payoutMethodId: string;
}

export type GetPayoutMethodsResponse = {
  payoutType: PayoutType;
  isDefault: boolean;
  accountHolderSurname: string;
  accountHolderName: string;
  userId: string;
  currency: EventTicketCurrency;
  /** @format date-time */
  updatedAt: string;
  metadata: string | number | boolean | JsonArray | JsonObject | null;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}[];

export interface AddPayoutMethodResponse {
  payoutType: PayoutType;
  isDefault: boolean;
  accountHolderSurname: string;
  accountHolderName: string;
  userId: string;
  currency: EventTicketCurrency;
  /** @format date-time */
  updatedAt: string;
  metadata: string | number | boolean | JsonArray | JsonObject | null;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

export type AddPayoutMethodRouteBody = (
  | {
      metadata:
        | {
            account_number: string;
            bank_name: "Itau";
          }
        | {
            account_number: string;
            bank_name: "OCA Blue";
          }
        | {
            account_number: string;
            bank_name: "PREX";
          }
        | {
            account_number: string;
            bank_name: "Banco Nacion Arg";
          }
        | {
            account_number: string;
            bank_name: "Bandes";
          }
        | {
            account_number: string;
            bank_name: "BBVA";
          }
        | {
            account_number: string;
            bank_name: "BHU";
          }
        | {
            account_number: string;
            bank_name: "BROU";
          }
        | {
            account_number: string;
            bank_name: "Citibank";
          }
        | {
            account_number: string;
            bank_name: "Dinero Electronico ANDA";
          }
        | {
            account_number: string;
            bank_name: "FUCAC";
          }
        | {
            account_number: string;
            bank_name: "FUCEREP";
          }
        | {
            account_number: string;
            bank_name: "GRIN";
          }
        | {
            account_number: string;
            bank_name: "Heritage";
          }
        | {
            account_number: string;
            bank_name: "HSBC";
          }
        | {
            account_number: string;
            bank_name: "Mercadopago";
          }
        | {
            account_number: string;
            bank_name: "Midinero";
          }
        | {
            account_number: string;
            bank_name: "Santander";
          }
        | {
            account_number: string;
            bank_name: "Scotiabank";
          };
      payoutType: "uruguayan_bank";
    }
  | {
      metadata: {
        email: string;
      };
      payoutType: "paypal";
    }
) & {
  isDefault?: boolean;
  currency: "USD" | "UYU";
  accountHolderSurname: string;
  accountHolderName: string;
};

export interface UpdatePayoutMethodResponse {
  payoutType: PayoutType;
  isDefault: boolean;
  accountHolderSurname: string;
  accountHolderName: string;
  userId: string;
  currency: EventTicketCurrency;
  /** @format date-time */
  updatedAt: string;
  metadata: string | number | boolean | JsonArray | JsonObject | null;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface UpdatePayoutMethodRouteBody {
  isDefault?: boolean;
  metadata?: any;
  currency?: "USD" | "UYU";
  accountHolderSurname?: string;
  accountHolderName?: string;
}

export interface DLocalWebhookrRouteBody {
  payment_id: string;
}

export interface CreatePaymentLinkResponse {
  redirectUrl: string;
  paymentId: string;
}

/** From T, pick a set of properties whose keys are in the union K */
export interface PickNotificationExcludeKeysMetadataOrActionsOrTypeOrTitleOrDescription {
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  deletedAt: string | null;
  id: string;
  status: "pending" | "failed" | "seen" | "sent";
  /** @format date-time */
  updatedAt: string;
  channels: ("email" | "in_app" | "sms")[];
  channelStatus: string | number | boolean | JsonArray | JsonObject | null;
  /** @format double */
  retryCount: number;
  /** @format date-time */
  seenAt: string | null;
  userId: string;
}

/** Construct a type with the properties of T except for those in type K. */
export type OmitNotificationMetadataOrActionsOrTypeOrTitleOrDescription =
  PickNotificationExcludeKeysMetadataOrActionsOrTypeOrTitleOrDescription;

/**
 * Typed metadata based on notification type
 * Extracts the specific metadata type from the discriminated union
 */
export type TypedNotificationMetadataNotificationMetadata =
  ExtractNotificationMetadataTypeNotificationMetadata;

/** Extract from T those types that are assignable to U */
export type ExtractNotificationMetadataTypeNotificationMetadata =
  TypedNotificationMetadataNotificationMetadata;

/** Extract from T those types that are assignable to U */
export type ExtractNotificationMetadataTypeNotificationType =
  TypedNotificationMetadataNotificationMetadata;

/**
 * Typed metadata based on notification type
 * Extracts the specific metadata type from the discriminated union
 */
export type TypedNotificationMetadataNotificationType =
  ExtractNotificationMetadataTypeNotificationType;

/** Construct a type with a set of properties K of type T */
export type RecordStringUnknown = object;

export interface InferTypeofBaseActionSchema {
  /** Construct a type with a set of properties K of type T */
  data?: RecordStringUnknown;
  url?: string;
  label: string;
  type: "upload_documents" | "view_order" | "retry_payment";
}

export type NotificationAction = InferTypeofBaseActionSchema;

/**
 * Typed notification response with parsed metadata and actions
 * This ensures type safety when reading notifications from the database
 * Title and description are generated from type + metadata, not stored in DB
 * For backwards compatibility, uses the generic type
 */
export type TypedNotification =
  OmitNotificationMetadataOrActionsOrTypeOrTitleOrDescription & {
    actions: NotificationAction[] | null;
    metadata: TypedNotificationMetadataNotificationType | null;
    description: string;
    title: string;
    type: NotificationType;
  };

export interface PaginatedResponseTypedNotification {
  data: TypedNotification[];
  pagination: PaginationMeta;
}

export type GetNotificationsResponse = PaginatedResponseTypedNotification;

export interface GetNotificationsQuery {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
  includeSeen?: boolean;
}

/** @format double */
export type GetUnseenCountResponse = number;

export type MarkAsSeenResponse = TypedNotification | null;

export type MarkAllAsSeenResponse = TypedNotification[];

export type DeleteNotificationResponse = TypedNotification | null;

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "/",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title @revendiste/backend
 * @version 1.0.0
 * @license ISC
 * @baseUrl /
 * @contact
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  events = {
    /**
     * No description
     *
     * @tags Events
     * @name GetAllPaginated
     * @request GET:/events
     */
    getAllPaginated: (
      query: {
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetEventsPaginatedResponse, any>({
        path: `/events`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name GetBySearch
     * @request GET:/events/search
     */
    getBySearch: (
      query: {
        query: string;
        /** @format double */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<SearchEventsResponse, any>({
        path: `/events/search`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name GetById
     * @request GET:/events/{eventId}
     */
    getById: (eventId: string, params: RequestParams = {}) =>
      this.request<GetEventByIdResponse, any>({
        path: `/events/${eventId}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  health = {
    /**
     * No description
     *
     * @tags Health
     * @name Basic
     * @request GET:/health
     */
    basic: (params: RequestParams = {}) =>
      this.request<
        {
          timestamp: string;
          status: string;
        },
        any
      >({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name Detailed
     * @request GET:/health/detailed
     */
    detailed: (params: RequestParams = {}) =>
      this.request<HealthCheck, any>({
        path: `/health/detailed`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name Database
     * @request GET:/health/database
     */
    database: (params: RequestParams = {}) =>
      this.request<
        | {
            database?: any;
            timestamp: string;
            message: string;
            status: string;
          }
        | {
            message?: any;
            database: HealthCheckResult;
            timestamp: string;
            status: "healthy" | "unhealthy" | "degraded";
          },
        any
      >({
        path: `/health/database`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name Memory
     * @request GET:/health/memory
     */
    memory: (params: RequestParams = {}) =>
      this.request<
        {
          memory: HealthCheckResult;
          timestamp: string;
          status: "healthy" | "unhealthy" | "degraded";
        },
        any
      >({
        path: `/health/memory`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name Readiness
     * @request GET:/health/ready
     */
    readiness: (params: RequestParams = {}) =>
      this.request<
        {
          timestamp: string;
          status: "healthy" | "unhealthy" | "degraded";
          ready: boolean;
        },
        any
      >({
        path: `/health/ready`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name Liveness
     * @request GET:/health/live
     */
    liveness: (params: RequestParams = {}) =>
      this.request<
        {
          /** @format double */
          uptime: number;
          timestamp: string;
          alive: boolean;
        },
        any
      >({
        path: `/health/live`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  ticketListings = {
    /**
     * No description
     *
     * @tags Ticket Listings
     * @name Create
     * @request POST:/ticket-listings
     */
    create: (data: CreateTicketListingRouteBody, params: RequestParams = {}) =>
      this.request<
        CreateTicketListingResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-listings`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Listings
     * @name GetMyListings
     * @request GET:/ticket-listings/my-listings
     */
    getMyListings: (params: RequestParams = {}) =>
      this.request<GetUserListingsResponse, UnauthorizedError>({
        path: `/ticket-listings/my-listings`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Upload a ticket document Sellers can upload PDF/image documents for their sold tickets. Documents must be uploaded before the event ends.
     *
     * @tags Ticket Listings
     * @name UploadDocument
     * @request POST:/ticket-listings/tickets/{ticketId}/document
     */
    uploadDocument: (
      ticketId: string,
      data: {
        /**
         * - Document file (PDF, PNG, JPG, JPEG - max 10MB)
         * @format binary
         */
        file: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        UploadDocumentResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-listings/tickets/${ticketId}/document`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description Update/replace a ticket document Uploads a new version of the document. Previous versions are kept for audit trail. Can only update before the event ends.
     *
     * @tags Ticket Listings
     * @name UpdateDocument
     * @request PUT:/ticket-listings/tickets/{ticketId}/document
     */
    updateDocument: (
      ticketId: string,
      data: {
        /**
         * - New document file (PDF, PNG, JPG, JPEG - max 10MB)
         * @format binary
         */
        file: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        UploadDocumentResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-listings/tickets/${ticketId}/document`,
        method: "PUT",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  orders = {
    /**
     * No description
     *
     * @tags Orders
     * @name Create
     * @request POST:/orders
     */
    create: (data: CreateOrderRouteBody, params: RequestParams = {}) =>
      this.request<
        CreateOrderResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name GetMyOrders
     * @request GET:/orders
     */
    getMyOrders: (params: RequestParams = {}) =>
      this.request<GetUserOrdersResponse, UnauthorizedError>({
        path: `/orders`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name GetById
     * @request GET:/orders/{orderId}
     */
    getById: (orderId: string, params: RequestParams = {}) =>
      this.request<GetOrderByIdResponse, UnauthorizedError | NotFoundError>({
        path: `/orders/${orderId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name GetOrderTickets
     * @request GET:/orders/{orderId}/tickets
     */
    getOrderTickets: (orderId: string, params: RequestParams = {}) =>
      this.request<GetOrderTicketsResponse, UnauthorizedError | NotFoundError>({
        path: `/orders/${orderId}/tickets`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  payouts = {
    /**
     * No description
     *
     * @tags Payouts
     * @name GetBalance
     * @request GET:/payouts/balance
     */
    getBalance: (params: RequestParams = {}) =>
      this.request<GetBalanceResponse, UnauthorizedError>({
        path: `/payouts/balance`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name GetAvailableEarnings
     * @request GET:/payouts/available-earnings
     */
    getAvailableEarnings: (params: RequestParams = {}) =>
      this.request<GetAvailableEarningsResponse, UnauthorizedError>({
        path: `/payouts/available-earnings`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name GetPayoutHistory
     * @request GET:/payouts/history
     */
    getPayoutHistory: (
      query: {
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetPayoutHistoryResponse, UnauthorizedError>({
        path: `/payouts/history`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name RequestPayout
     * @request POST:/payouts/request
     */
    requestPayout: (data: RequestPayoutRouteBody, params: RequestParams = {}) =>
      this.request<RequestPayoutResponse, UnauthorizedError | ValidationError>({
        path: `/payouts/request`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name GetPayoutMethods
     * @request GET:/payouts/payout-methods
     */
    getPayoutMethods: (params: RequestParams = {}) =>
      this.request<GetPayoutMethodsResponse, UnauthorizedError>({
        path: `/payouts/payout-methods`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name AddPayoutMethod
     * @request POST:/payouts/payout-methods
     */
    addPayoutMethod: (
      data: AddPayoutMethodRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        AddPayoutMethodResponse,
        UnauthorizedError | ValidationError
      >({
        path: `/payouts/payout-methods`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name UpdatePayoutMethod
     * @request PUT:/payouts/payout-methods/{payoutMethodId}
     */
    updatePayoutMethod: (
      payoutMethodId: string,
      data: UpdatePayoutMethodRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        UpdatePayoutMethodResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/payouts/payout-methods/${payoutMethodId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payouts
     * @name DeletePayoutMethod
     * @request DELETE:/payouts/payout-methods/{payoutMethodId}
     */
    deletePayoutMethod: (payoutMethodId: string, params: RequestParams = {}) =>
      this.request<void, UnauthorizedError | NotFoundError>({
        path: `/payouts/payout-methods/${payoutMethodId}`,
        method: "DELETE",
        ...params,
      }),
  };
  webhooks = {
    /**
     * @description Receives payment status notifications from dLocal
     *
     * @tags Webhooks
     * @name HandleDLocalWebhook
     * @summary dLocal payment webhook
     * @request POST:/webhooks/dlocal
     */
    handleDLocalWebhook: (
      data: DLocalWebhookrRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          received: boolean;
        },
        any
      >({
        path: `/webhooks/dlocal`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  payments = {
    /**
     * No description
     *
     * @tags Payments
     * @name CreatePaymentLink
     * @request POST:/payments/create-link/{orderId}
     */
    createPaymentLink: (orderId: string, params: RequestParams = {}) =>
      this.request<
        CreatePaymentLinkResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/payments/create-link/${orderId}`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  notifications = {
    /**
     * No description
     *
     * @tags Notifications
     * @name GetNotifications
     * @request GET:/notifications
     */
    getNotifications: (
      query: {
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
        includeSeen?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetNotificationsResponse, UnauthorizedError>({
        path: `/notifications`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name GetUnseenCount
     * @request GET:/notifications/unseen-count
     */
    getUnseenCount: (params: RequestParams = {}) =>
      this.request<GetUnseenCountResponse, UnauthorizedError>({
        path: `/notifications/unseen-count`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name MarkAsSeen
     * @request PATCH:/notifications/{notificationId}/seen
     */
    markAsSeen: (notificationId: string, params: RequestParams = {}) =>
      this.request<MarkAsSeenResponse, UnauthorizedError | NotFoundError>({
        path: `/notifications/${notificationId}/seen`,
        method: "PATCH",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name MarkAllAsSeen
     * @request PATCH:/notifications/seen-all
     */
    markAllAsSeen: (params: RequestParams = {}) =>
      this.request<MarkAllAsSeenResponse, UnauthorizedError>({
        path: `/notifications/seen-all`,
        method: "PATCH",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name DeleteNotification
     * @request DELETE:/notifications/{notificationId}
     */
    deleteNotification: (notificationId: string, params: RequestParams = {}) =>
      this.request<
        DeleteNotificationResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/notifications/${notificationId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
}
