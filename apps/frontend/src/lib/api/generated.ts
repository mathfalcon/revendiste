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

export interface PaginatedResponseCreatedAtDateDescriptionStringOrNullEventEndDateDateEventStartDateDateExternalUrlStringIdStringNameStringStatusStringUpdatedAtDateVenueAddressStringVenueNameStringOrNullImages58UrlStringImageTypeEventImageTypeArray {
  data: {
    images: {
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
  pagination: PaginationMeta;
}

/** Obtain the return type of a function type */
export type ReturnTypeEventsServiceAtGetAllEventsPaginated =
  PaginatedResponseCreatedAtDateDescriptionStringOrNullEventEndDateDateEventStartDateDateExternalUrlStringIdStringNameStringStatusStringUpdatedAtDateVenueAddressStringVenueNameStringOrNullImages58UrlStringImageTypeEventImageTypeArray;

export type GetEventsPaginatedResponse =
  ReturnTypeEventsServiceAtGetAllEventsPaginated;

export interface InferTypeofPaginationSchema {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type PaginationQuery = InferTypeofPaginationSchema;

/** Obtain the return type of a function type */
export type ReturnTypeEventsServiceAtGetBySearch = {
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

export type SearchEventsResponse = ReturnTypeEventsServiceAtGetBySearch;

/** Obtain the return type of a function type */
export interface ReturnTypeEventsServiceAtGetEventById {
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

export type GetEventByIdResponse = ReturnTypeEventsServiceAtGetEventById;

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

/** Obtain the return type of a function type */
export interface ReturnTypeTicketListingsServiceAtCreateTicketListing {
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

export type CreateTicketListingResponse =
  ReturnTypeTicketListingsServiceAtCreateTicketListing;

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

/** Obtain the return type of a function type */
export type ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets = {
  tickets: {
    /** @format double */
    ticketNumber: number;
    price: string;
    cancelledAt: string | null;
    soldAt: string | null;
    updatedAt: string;
    id: string;
    createdAt: string;
  }[];
  event: {
    venueName: string | null;
    venueAddress: string;
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
}[];

export type GetUserListingsResponse =
  ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets;

/** Obtain the return type of a function type */
export interface ReturnTypeOrdersServiceAtCreateOrder {
  vatOnCommission: string;
  userId: string;
  totalAmount: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
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

export type CreateOrderResponse = ReturnTypeOrdersServiceAtCreateOrder;

/** Construct a type with a set of properties K of type T */
export type RecordStringRecordStringNumber = object;

export interface CreateOrderRouteBody {
  /** Construct a type with a set of properties K of type T */
  ticketSelections: RecordStringRecordStringNumber;
  eventId: string;
}

/** Obtain the return type of a function type */
export interface ReturnTypeOrdersServiceAtGetOrderById {
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
    name: string | null;
    id: string | null;
    eventStartDate: string | null;
    eventEndDate: string | null;
  };
  vatOnCommission: string;
  userId: string;
  totalAmount: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
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

export type GetOrderByIdResponse = ReturnTypeOrdersServiceAtGetOrderById;

export interface DLocalWebhookrRouteBody {
  payment_id: string;
}

export interface CreatePaymentLinkResponse {
  redirectUrl: string;
  paymentId: string;
}

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
 * @title backend
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
}
