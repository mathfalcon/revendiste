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

export enum IdentityVerificationStatus {
  Pending = "pending",
  RequiresManualReview = "requires_manual_review",
  Completed = "completed",
  Failed = "failed",
}

export enum NotificationType {
  AuthInvitation = "auth_invitation",
  AuthNewDeviceSignIn = "auth_new_device_sign_in",
  AuthPasswordChanged = "auth_password_changed",
  AuthPasswordRemoved = "auth_password_removed",
  AuthPrimaryEmailChanged = "auth_primary_email_changed",
  AuthResetPasswordCode = "auth_reset_password_code",
  AuthVerificationCode = "auth_verification_code",
  BuyerTicketCancelled = "buyer_ticket_cancelled",
  DocumentReminder = "document_reminder",
  DocumentUploaded = "document_uploaded",
  DocumentUploadedBatch = "document_uploaded_batch",
  IdentityVerificationCompleted = "identity_verification_completed",
  IdentityVerificationFailed = "identity_verification_failed",
  IdentityVerificationManualReview = "identity_verification_manual_review",
  IdentityVerificationRejected = "identity_verification_rejected",
  OrderConfirmed = "order_confirmed",
  OrderExpired = "order_expired",
  OrderInvoice = "order_invoice",
  PaymentFailed = "payment_failed",
  PaymentSucceeded = "payment_succeeded",
  PayoutCancelled = "payout_cancelled",
  PayoutCompleted = "payout_completed",
  PayoutFailed = "payout_failed",
  PayoutProcessing = "payout_processing",
  SellerEarningsRetained = "seller_earnings_retained",
  TicketReportActionAdded = "ticket_report_action_added",
  TicketReportClosed = "ticket_report_closed",
  TicketReportCreated = "ticket_report_created",
  TicketReportStatusChanged = "ticket_report_status_changed",
  TicketSoldSeller = "ticket_sold_seller",
}

/**
 * Union type of all error class names that can be returned by the API.
 * Used for type-safe error handling on the frontend.
 */
export enum ErrorClassName {
  AppError = "AppError",
  BadRequestError = "BadRequestError",
  UnauthorizedError = "UnauthorizedError",
  ForbiddenError = "ForbiddenError",
  NotFoundError = "NotFoundError",
  ConflictError = "ConflictError",
  ValidationError = "ValidationError",
  TooManyRequestsError = "TooManyRequestsError",
  MaxAttemptsExceededError = "MaxAttemptsExceededError",
  InternalServerError = "InternalServerError",
  ServiceUnavailableError = "ServiceUnavailableError",
  DatabaseError = "DatabaseError",
  ZodValidationError = "ZodValidationError",
}

export enum TicketReportActionType {
  Close = "close",
  Comment = "comment",
  RefundFull = "refund_full",
  RefundPartial = "refund_partial",
  Reject = "reject",
}

export enum TicketReportSource {
  AutoMissingDocument = "auto_missing_document",
  UserReport = "user_report",
}

export enum TicketReportStatus {
  AwaitingCustomer = "awaiting_customer",
  AwaitingSupport = "awaiting_support",
  Closed = "closed",
}

export enum TicketReportEntityType {
  Listing = "listing",
  ListingTicket = "listing_ticket",
  Order = "order",
  OrderTicketReservation = "order_ticket_reservation",
}

export enum TicketReportCaseType {
  InvalidTicket = "invalid_ticket",
  Other = "other",
  ProblemWithSeller = "problem_with_seller",
  TicketNotReceived = "ticket_not_received",
}

export enum DocumentTypeEnum {
  CiUy = "ci_uy",
  DniAr = "dni_ar",
  Passport = "passport",
}

export enum PayoutStatus {
  Cancelled = "cancelled",
  Completed = "completed",
  Failed = "failed",
  Pending = "pending",
  Processing = "processing",
}

export enum PayoutEventType {
  AdminProcessed = "admin_processed",
  Cancelled = "cancelled",
  PayoutRequested = "payout_requested",
  StatusChange = "status_change",
  TransferCompleted = "transfer_completed",
  TransferFailed = "transfer_failed",
  TransferInitiated = "transfer_initiated",
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

export enum QrAvailabilityTiming {
  Value12H = "12h",
  Value24H = "24h",
  Value3H = "3h",
  Value48H = "48h",
  Value6H = "6h",
  Value72H = "72h",
}

export enum EventImageType {
  Flyer = "flyer",
  Hero = "hero",
  OgHero = "og_hero",
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

export interface PaginatedResponseCreatedAtDateDescriptionStringOrNullEventEndDateDateEventStartDateDateExternalUrlStringIdStringNameStringSlugStringStatusStringUpdatedAtDateVenueNameStringOrNullVenueAddressStringOrNullVenueCityStringOrNullLowestAvailableTicketPriceNumberOrNullLowestAvailableTicketCurrencyStringOrNullImages58UrlStringImageTypeEventImageTypeArray {
  data: {
    images: {
      imageType: EventImageType;
      url: string;
    }[];
    lowestAvailableTicketCurrency: string | null;
    /** @format double */
    lowestAvailableTicketPrice: number | null;
    venueCity: string | null;
    venueAddress: string | null;
    venueName: string | null;
    /** @format date-time */
    updatedAt: string;
    status: string;
    slug: string;
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
  PaginatedResponseCreatedAtDateDescriptionStringOrNullEventEndDateDateEventStartDateDateExternalUrlStringIdStringNameStringSlugStringStatusStringUpdatedAtDateVenueNameStringOrNullVenueAddressStringOrNullVenueCityStringOrNullLowestAvailableTicketPriceNumberOrNullLowestAvailableTicketCurrencyStringOrNullImages58UrlStringImageTypeEventImageTypeArray;

export interface InferTypeofPaginationSchema {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export interface EventsPaginatedQuery {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
  /** Filter by city name */
  city?: string;
  /** Filter by region/state/departamento name */
  region?: string;
  /**
   * Latitude for proximity search (requires lng)
   * @format double
   */
  lat?: number;
  /**
   * Longitude for proximity search (requires lat)
   * @format double
   */
  lng?: number;
  /**
   * Radius in km for proximity search (default: 30)
   * @format double
   */
  radiusKm?: number;
  /** Filter events starting from this date (ISO format) */
  dateFrom?: string;
  /** Filter events ending before this date (ISO format) */
  dateTo?: string;
  /** Only show events with at least one available ticket */
  hasTickets?: boolean;
  /**
   * User timezone offset in minutes from UTC (e.g. 180 for UTC-3)
   * @format double
   */
  tzOffset?: number;
}

export type SearchEventsResponse = {
  eventImages: {
    imageType: EventImageType;
    url: string;
  }[];
  venueCity: string | null;
  venueAddress: string | null;
  venueName: string | null;
  /** @format date-time */
  updatedAt: string;
  status: string;
  slug: string;
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

export type GetTrendingEventsResponse = {
  venue: {
    city: string;
    name: string;
  } | null;
  /** @format double */
  totalViews: number;
  eventImages: {
    imageType: EventImageType;
    url: string;
  }[];
  lowestAvailableTicketCurrency: string | null;
  /** @format double */
  lowestAvailableTicketPrice: number | null;
  /** @format date-time */
  updatedAt: string;
  status: string;
  slug: string;
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
  venueId: string | null;
}[];

export type GetDistinctCitiesResponse = string[];

export type GetDistinctRegionsResponse = {
  regions: string[];
  country: string;
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
  /** @format double */
  userActiveTicketCount: number;
  /** @format double */
  userListingsCount: number;
  venueLongitude: string | null;
  venueLatitude: string | null;
  venueCountry: string | null;
  eventImages: {
    imageType: EventImageType;
    url: string;
  }[];
  venueCity: string | null;
  venueAddress: string | null;
  venueName: string | null;
  /** @format date-time */
  updatedAt: string;
  status: string;
  slug: string;
  qrAvailabilityTiming: QrAvailabilityTiming | null;
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

export type GetEventBySlugResponse = GetEventByIdResponse;

export interface TrackViewResponse {
  success: boolean;
}

/** Construct a type with a set of properties K of type T */
export type RecordStringUnknown = Record<string, any>;

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  /** @format double */
  responseTime?: number;
  /** Construct a type with a set of properties K of type T */
  details?: RecordStringUnknown;
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

/** Construct a type with a set of properties K of type T */
export type RecordStringAny = Record<string, any>;

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

export interface PaginatedResponseTickets58HasDocumentBooleanCanUploadDocumentBooleanUploadUnavailableReasonUploadAvailabilityReasonOrUndefinedUploadAvailableAtStringOrUndefinedCreatedAtStringDeletedAtStringOrNullIdStringUpdatedAtStringSoldAtStringOrNullPriceStringTicketNumberNumberDocument58IdStringStatusStringUploadedAtStringOrNullArrayCreatedAtDateIdStringUpdatedAtDateSoldAtDateOrNullTicketWave58IdStringNameStringCurrencyEventTicketCurrencyFaceValueStringEvent58DescriptionStringOrNullEventEndDateStringEventStartDateStringIdStringNameStringPlatformStringQrAvailabilityTimingQrAvailabilityTimingOrNullSlugStringVenueNameStringOrNullVenueAddressStringOrNullEventImages58UrlStringImageTypeEventImageTypeArray {
  data: {
    event: {
      eventImages: {
        imageType: EventImageType;
        url: string;
      }[];
      venueAddress: string | null;
      venueName: string | null;
      slug: string;
      qrAvailabilityTiming: QrAvailabilityTiming | null;
      platform: string;
      name: string;
      id: string;
      eventStartDate: string;
      eventEndDate: string;
      description: string | null;
    };
    ticketWave: {
      faceValue: string;
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
      soldAt: string | null;
      updatedAt: string;
      id: string;
      deletedAt: string | null;
      createdAt: string;
      uploadAvailableAt?: string;
      uploadUnavailableReason?: UploadAvailabilityReason;
      canUploadDocument: boolean;
      hasDocument: boolean;
    }[];
  }[];
  pagination: PaginationMeta;
}

export type GetUserListingsResponse =
  PaginatedResponseTickets58HasDocumentBooleanCanUploadDocumentBooleanUploadUnavailableReasonUploadAvailabilityReasonOrUndefinedUploadAvailableAtStringOrUndefinedCreatedAtStringDeletedAtStringOrNullIdStringUpdatedAtStringSoldAtStringOrNullPriceStringTicketNumberNumberDocument58IdStringStatusStringUploadedAtStringOrNullArrayCreatedAtDateIdStringUpdatedAtDateSoldAtDateOrNullTicketWave58IdStringNameStringCurrencyEventTicketCurrencyFaceValueStringEvent58DescriptionStringOrNullEventEndDateStringEventStartDateStringIdStringNameStringPlatformStringQrAvailabilityTimingQrAvailabilityTimingOrNullSlugStringVenueNameStringOrNullVenueAddressStringOrNullEventImages58UrlStringImageTypeEventImageTypeArray;

export interface UploadDocumentResponse {
  documentUrl: string;
  document?: {
    /** @format double */
    version: number;
    verifiedBy: string | null;
    /** @format date-time */
    verifiedAt: string | null;
    ticketId: string;
    isPrimary: boolean;
    /** @format date-time */
    uploadedAt: string;
    storagePath: string;
    /** @format double */
    sizeBytes: number;
    originalName: string;
    mimeType: string;
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

export interface UpdateTicketPriceResponse {
  /** @format double */
  ticketNumber: number;
  price: string;
  listingId: string;
  /** @format date-time */
  soldAt: string | null;
  /** @format date-time */
  updatedAt: string;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface UpdateTicketPriceRouteBody {
  /** @format double */
  price: number;
}

export interface RemoveTicketResponse {
  /** @format double */
  ticketNumber: number;
  price: string;
  listingId: string;
  /** @format date-time */
  soldAt: string | null;
  /** @format date-time */
  updatedAt: string;
  id: string;
  /** @format date-time */
  deletedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface GetTicketInfoResponse {
  ticketWave: {
    name: string;
  };
  event: {
    /** @format date-time */
    startDate: string;
    name: string;
    id: string;
  };
  documentHistory: {
    status: string;
    isPrimary: boolean;
    /** @format date-time */
    uploadedAt: string;
    /** @format double */
    version: number;
    id: string;
  }[];
  document: {
    url: string;
    status: string;
    /** @format double */
    version: number;
    /** @format double */
    sizeBytes: number;
    originalName: string;
    mimeType: string;
    /** @format date-time */
    uploadedAt: string;
    id: string;
  } | null;
  hasDocument: boolean;
  /** @format date-time */
  soldAt: string | null;
  price: string;
  /** @format double */
  ticketNumber: number;
  listingId: string;
  id: string;
}

export interface CreateOrderResponse {
  vatOnCommission: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
  /** @format date-time */
  cancelledAt: string | null;
  userId: string;
  totalAmount: string;
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
    venueCountry: string | null;
    venueAddress: string | null;
    venueName: string | null;
    slug: string | null;
    qrAvailabilityTiming: QrAvailabilityTiming | null;
    platform: string | null;
    name: string | null;
    id: string | null;
    eventStartDate: string | null;
    eventEndDate: string | null;
  };
  vatOnCommission: string;
  subtotalAmount: string;
  /** @format date-time */
  reservationExpiresAt: string;
  platformCommission: string;
  /** @format date-time */
  confirmedAt: string | null;
  /** @format date-time */
  cancelledAt: string | null;
  userId: string;
  totalAmount: string;
  currency: EventTicketCurrency;
  eventId: string;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "confirmed" | "expired" | "pending";
  id: string;
  /** @format date-time */
  createdAt: string;
}

export interface PaginatedResponseCreatedAtDateIdStringStatusCancelledOrConfirmedOrExpiredOrPendingUpdatedAtDateEventIdStringCurrencyEventTicketCurrencyTotalAmountStringUserIdStringCancelledAtDateOrNullConfirmedAtDateOrNullPlatformCommissionStringReservationExpiresAtDateSubtotalAmountStringVatOnCommissionStringEvent58EventEndDateStringOrNullEventStartDateStringOrNullIdStringOrNullNameStringOrNullPlatformStringOrNullSlugStringOrNullVenueNameStringOrNullVenueAddressStringOrNullVenueCountryStringOrNullImages58UrlStringImageTypeEventImageTypeArrayOrNullItems58CurrencyEventTicketCurrencyOrNullIdStringTicketWaveIdStringPricePerTicketStringQuantityNumberSubtotalStringTicketWaveNameStringOrNullArray {
  data: {
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
      venueCountry: string | null;
      venueAddress: string | null;
      venueName: string | null;
      slug: string | null;
      platform: string | null;
      name: string | null;
      id: string | null;
      eventStartDate: string | null;
      eventEndDate: string | null;
    };
    vatOnCommission: string;
    subtotalAmount: string;
    /** @format date-time */
    reservationExpiresAt: string;
    platformCommission: string;
    /** @format date-time */
    confirmedAt: string | null;
    /** @format date-time */
    cancelledAt: string | null;
    userId: string;
    totalAmount: string;
    currency: EventTicketCurrency;
    eventId: string;
    /** @format date-time */
    updatedAt: string;
    status: "cancelled" | "confirmed" | "expired" | "pending";
    id: string;
    /** @format date-time */
    createdAt: string;
  }[];
  pagination: PaginationMeta;
}

export type GetUserOrdersResponse =
  PaginatedResponseCreatedAtDateIdStringStatusCancelledOrConfirmedOrExpiredOrPendingUpdatedAtDateEventIdStringCurrencyEventTicketCurrencyTotalAmountStringUserIdStringCancelledAtDateOrNullConfirmedAtDateOrNullPlatformCommissionStringReservationExpiresAtDateSubtotalAmountStringVatOnCommissionStringEvent58EventEndDateStringOrNullEventStartDateStringOrNullIdStringOrNullNameStringOrNullPlatformStringOrNullSlugStringOrNullVenueNameStringOrNullVenueAddressStringOrNullVenueCountryStringOrNullImages58UrlStringImageTypeEventImageTypeArrayOrNullItems58CurrencyEventTicketCurrencyOrNullIdStringTicketWaveIdStringPricePerTicketStringQuantityNumberSubtotalStringTicketWaveNameStringOrNullArray;

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
    reservationStatus: "active" | "cancelled" | "refund_pending" | "refunded";
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

export interface CancelOrderResponse {
  /** @format date-time */
  cancelledAt: string | null;
  status: "cancelled" | "confirmed" | "expired" | "pending";
  id: string;
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
  payoutPending: BalanceByCurrency[];
  paidOut: BalanceByCurrency[];
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

export type PaginationQuery = InferTypeofPaginationSchema;

export type JsonArray = JsonValue[];

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type JsonObject = Record<string, JsonValue>;

export type JsonPrimitive = boolean | number | string | null;

export interface RequestPayoutResponse {
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
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
            accountNumber: string;
            bankName: "Itau";
          }
        | {
            accountNumber: string;
            bankName: "OCA Blue";
          }
        | {
            accountNumber: string;
            bankName: "PREX";
          }
        | {
            accountNumber: string;
            bankName: "Banco Nacion Arg";
          }
        | {
            accountNumber: string;
            bankName: "Bandes";
          }
        | {
            accountNumber: string;
            bankName: "BBVA";
          }
        | {
            accountNumber: string;
            bankName: "BHU";
          }
        | {
            accountNumber: string;
            bankName: "BROU";
          }
        | {
            accountNumber: string;
            bankName: "Citibank";
          }
        | {
            accountNumber: string;
            bankName: "Dinero Electronico ANDA";
          }
        | {
            accountNumber: string;
            bankName: "FUCAC";
          }
        | {
            accountNumber: string;
            bankName: "FUCEREP";
          }
        | {
            accountNumber: string;
            bankName: "GRIN";
          }
        | {
            accountNumber: string;
            bankName: "Heritage";
          }
        | {
            accountNumber: string;
            bankName: "HSBC";
          }
        | {
            accountNumber: string;
            bankName: "Mercadopago";
          }
        | {
            accountNumber: string;
            bankName: "Midinero";
          }
        | {
            accountNumber: string;
            bankName: "Santander";
          }
        | {
            accountNumber: string;
            bankName: "Scotiabank";
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

export interface GetUserPayoutDetailsResponse {
  linkedEarnings: {
    sellerAmount: string;
    listingTicketId: string;
    currency: EventTicketCurrency;
    id: string;
    createdAt: string;
  }[];
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
  currency: EventTicketCurrency;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "pending" | "completed" | "failed" | "processing";
  id: string;
  /** @format date-time */
  createdAt: string;
  payoutMethod: {
    metadata: string | number | boolean | JsonArray | JsonObject | null;
    currency: EventTicketCurrency;
    accountHolderSurname: string;
    accountHolderName: string;
    payoutType: PayoutType;
    id: string;
  };
  documents: {
    uploadedBy: string;
    /** @format date-time */
    uploadedAt: string;
    storagePath: string;
    /** @format double */
    sizeBytes: number;
    payoutId: string;
    originalName: string;
    mimeType: string;
    fileName: string;
    documentType: string;
    /** @format date-time */
    updatedAt: string;
    id: string;
    /** @format date-time */
    deletedAt: string | null;
    /** @format date-time */
    createdAt: string;
    url: string;
  }[];
  events: {
    createdBy: string | null;
    payoutId: string;
    userAgent: string | null;
    toStatus: PayoutStatus | null;
    ipAddress: string | null;
    fromStatus: PayoutStatus | null;
    eventType: PayoutEventType;
    eventData: string | number | boolean | JsonArray | JsonObject | null;
    id: string;
    /** @format date-time */
    createdAt: string;
  }[];
  metadata: {
    voucherUrl?: string;
    currencyConversion?: {
      convertedAt: string;
      /** @format double */
      exchangeRate: number;
      originalCurrency: string;
      /** @format double */
      originalAmount: number;
    };
    listingIds: string[];
    listingTicketIds: string[];
  } | null;
}

export interface PaginatedResponseCreatedAtDateIdStringMetadataStringOrNumberOrBooleanOrJsonArrayOrJsonObjectOrNullStatusCancelledOrPendingOrCompletedOrFailedOrProcessingUpdatedAtDateCurrencyEventTicketCurrencySellerUserIdStringCompletedAtDateOrNullAmountStringFailedAtDateOrNullFailureReasonStringOrNullNotesStringOrNullPayoutMethodIdStringProcessedAtDateOrNullProcessedByStringOrNullProcessingFeeStringOrNullRequestedAtDateTransactionReferenceStringOrNullLinkedEarnings58CreatedAtStringIdStringCurrencyEventTicketCurrencyListingTicketIdStringSellerAmountStringArraySeller58IdStringEmailStringFirstNameStringOrNullLastNameStringOrNullOrNullPayoutMethod58IdStringAccountHolderNameStringAccountHolderSurnameStringPayoutTypePayoutTypeOrNull {
  data: {
    payoutMethod: {
      payoutType: PayoutType;
      accountHolderSurname: string;
      accountHolderName: string;
      id: string;
    } | null;
    seller: {
      lastName: string | null;
      firstName: string | null;
      email: string;
      id: string;
    };
    linkedEarnings: {
      sellerAmount: string;
      listingTicketId: string;
      currency: EventTicketCurrency;
      id: string;
      createdAt: string;
    }[];
    transactionReference: string | null;
    /** @format date-time */
    requestedAt: string;
    processingFee: string | null;
    processedBy: string | null;
    /** @format date-time */
    processedAt: string | null;
    payoutMethodId: string;
    notes: string | null;
    failureReason: string | null;
    /** @format date-time */
    failedAt: string | null;
    amount: string;
    /** @format date-time */
    completedAt: string | null;
    sellerUserId: string;
    currency: EventTicketCurrency;
    /** @format date-time */
    updatedAt: string;
    status: "cancelled" | "pending" | "completed" | "failed" | "processing";
    metadata: string | number | boolean | JsonArray | JsonObject | null;
    id: string;
    /** @format date-time */
    createdAt: string;
  }[];
  pagination: PaginationMeta;
}

export type GetPayoutsResponse =
  PaginatedResponseCreatedAtDateIdStringMetadataStringOrNumberOrBooleanOrJsonArrayOrJsonObjectOrNullStatusCancelledOrPendingOrCompletedOrFailedOrProcessingUpdatedAtDateCurrencyEventTicketCurrencySellerUserIdStringCompletedAtDateOrNullAmountStringFailedAtDateOrNullFailureReasonStringOrNullNotesStringOrNullPayoutMethodIdStringProcessedAtDateOrNullProcessedByStringOrNullProcessingFeeStringOrNullRequestedAtDateTransactionReferenceStringOrNullLinkedEarnings58CreatedAtStringIdStringCurrencyEventTicketCurrencyListingTicketIdStringSellerAmountStringArraySeller58IdStringEmailStringFirstNameStringOrNullLastNameStringOrNullOrNullPayoutMethod58IdStringAccountHolderNameStringAccountHolderSurnameStringPayoutTypePayoutTypeOrNull;

export interface InferTypeofAdminPayoutsQuerySchema {
  status?: "cancelled" | "pending" | "completed" | "failed";
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type AdminPayoutsQuery = InferTypeofAdminPayoutsQuerySchema;

export interface GetPayoutDetailsResponse {
  linkedEarnings: {
    sellerAmount: string;
    listingTicketId: string;
    currency: EventTicketCurrency;
    id: string;
    createdAt: string;
  }[];
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
  currency: EventTicketCurrency;
  /** @format date-time */
  updatedAt: string;
  status: "cancelled" | "pending" | "completed" | "failed" | "processing";
  id: string;
  /** @format date-time */
  createdAt: string;
  payoutMethod: {
    metadata: string | number | boolean | JsonArray | JsonObject | null;
    currency: EventTicketCurrency;
    accountHolderSurname: string;
    accountHolderName: string;
    payoutType: PayoutType;
    id: string;
  };
  settlementInfo: {
    providers: string[];
    hasExchangeRateData: boolean;
    settlements: {
      providers: string[];
      /** @format double */
      paymentCount: number;
      balanceCurrency: string | null;
      /** @format double */
      averageExchangeRate: number | null;
      /** @format double */
      totalSellerAmount: number;
      /** @format double */
      totalBalanceFee: number;
      /** @format double */
      totalBalanceAmount: number;
      /** @format double */
      totalPaymentAmount: number;
      currency: string;
    }[];
  };
  documents: {
    uploadedBy: string;
    /** @format date-time */
    uploadedAt: string;
    storagePath: string;
    /** @format double */
    sizeBytes: number;
    payoutId: string;
    originalName: string;
    mimeType: string;
    fileName: string;
    documentType: string;
    /** @format date-time */
    updatedAt: string;
    id: string;
    /** @format date-time */
    deletedAt: string | null;
    /** @format date-time */
    createdAt: string;
    url: string;
  }[];
  metadata: {
    voucherUrl?: string;
    currencyConversion?: {
      convertedAt: string;
      /** @format double */
      exchangeRate: number;
      originalCurrency: string;
      /** @format double */
      originalAmount: number;
    };
    listingIds: string[];
    listingTicketIds: string[];
  } | null;
}

export interface ProcessPayoutResponse {
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
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

export interface ProcessPayoutRouteBody {
  voucherUrl?: string;
  notes?: string;
  transactionReference?: string;
  /** @format double */
  processingFee?: number;
}

export interface CompletePayoutResponse {
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
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

export interface CompletePayoutRouteBody {
  voucherUrl?: string;
  transactionReference?: string;
}

export interface FailPayoutResponse {
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
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

export interface FailPayoutRouteBody {
  failureReason: string;
}

export interface UpdatePayoutResponse {
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
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

export interface UpdatePayoutRouteBody {
  transactionReference?: string;
  voucherUrl?: string;
  notes?: string;
  /** @format double */
  processingFee?: number;
  status?: "cancelled" | "pending" | "completed" | "failed";
}

export interface CancelPayoutResponse {
  transactionReference: string | null;
  /** @format date-time */
  requestedAt: string;
  processingFee: string | null;
  processedBy: string | null;
  /** @format date-time */
  processedAt: string | null;
  payoutMethodId: string;
  notes: string | null;
  failureReason: string | null;
  /** @format date-time */
  failedAt: string | null;
  amount: string;
  /** @format date-time */
  completedAt: string | null;
  sellerUserId: string;
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

export interface CancelPayoutRouteBody {
  failureReason: string;
  reasonType: "error" | "other";
}

export interface UploadPayoutDocumentResponse {
  documentUrl: string;
  document: {
    uploadedBy: string;
    /** @format date-time */
    uploadedAt: string;
    storagePath: string;
    /** @format double */
    sizeBytes: number;
    payoutId: string;
    originalName: string;
    mimeType: string;
    fileName: string;
    documentType: string;
    /** @format date-time */
    updatedAt: string;
    id: string;
    /** @format date-time */
    deletedAt: string | null;
    /** @format date-time */
    createdAt: string;
  };
}

export interface DeletePayoutDocumentResponse {
  success: boolean;
}

export interface GetVerificationsResponse {
  pagination: {
    hasPrev: boolean;
    hasNext: boolean;
    /** @format double */
    totalPages: number;
    /** @format double */
    total: number;
    /** @format double */
    limit: number;
    /** @format double */
    page: number;
  };
  data: {
    /** @format date-time */
    updatedAt: string;
    /** @format date-time */
    createdAt: string;
    verificationConfidenceScores: JsonValue;
    manualReviewReason: string | null;
    /** @format double */
    verificationAttempts: number | null;
    verificationStatus:
      | "pending"
      | "completed"
      | "failed"
      | "rejected"
      | "requires_manual_review"
      | null;
    documentCountry: string | null;
    documentNumber: string | null;
    documentType: DocumentTypeEnum | null;
    lastName: string | null;
    firstName: string | null;
    email: string;
    id: string;
  }[];
}

export interface InferTypeofAdminVerificationsQuerySchema {
  status?:
    | "pending"
    | "completed"
    | "failed"
    | "rejected"
    | "requires_manual_review";
  sortOrder?: "asc" | "desc";
  sortBy: "createdAt" | "updatedAt" | "verificationAttempts";
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type AdminVerificationsQuery = InferTypeofAdminVerificationsQuerySchema;

export interface GetVerificationDetailsResponse {
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  createdAt: string;
  metadata: {
    failedAt: object | null;
    failureReason: object | null;
    processedAt: object | null;
    livenessSessionId: object | null;
  };
  images: {
    /** @format double */
    auditImagesCount: number;
    hasReferenceImage: boolean;
    hasDocumentImage: boolean;
  };
  confidenceScores: {
    /** @format double */
    liveness: number | null;
    /** @format double */
    faceMatch: number | null;
    /** @format double */
    textDetection: number | null;
  };
  /** @format date-time */
  documentVerifiedAt: string | null;
  documentVerified: boolean | null;
  manualReviewReason: string | null;
  /** @format double */
  verificationAttempts: number | null;
  verificationStatus:
    | "pending"
    | "completed"
    | "failed"
    | "rejected"
    | "requires_manual_review"
    | null;
  documentCountry: string | null;
  documentNumber: string | null;
  documentType: DocumentTypeEnum | null;
  lastName: string | null;
  firstName: string | null;
  email: string;
  id: string;
}

export interface GetVerificationImageUrlResponse {
  /** @format double */
  expiresIn: number;
  url: string;
}

export interface ApproveVerificationResponse {
  message: "Verificación aprobada";
  success: boolean;
}

export interface ApproveVerificationRouteBody {
  notes?: string;
}

export interface RejectVerificationResponse {
  message: "Verificación rechazada";
  success: boolean;
}

export interface RejectVerificationRouteBody {
  reason: string;
}

export interface GetVerificationAuditHistoryResponse {
  pagination: {
    /** @format double */
    total: number;
    /** @format double */
    offset: number;
    /** @format double */
    limit: number;
  };
  data: {
    previousStatus: string | null;
    newStatus: string | null;
    confidenceScores: JsonValue;
    action: string;
    userId: string;
    metadata: JsonValue;
    id: string;
    /** @format date-time */
    createdAt: string;
  }[];
}

/**
 * Explicit response types for the Admin Events controller
 * These are needed because Kysely's inferred types are too complex for TSOA
 */
export interface AdminEventImage {
  id: string;
  url: string;
  imageType: string;
  /** @format double */
  displayOrder: number;
  createdAt?: string;
}

export interface AdminTicketWave {
  id: string;
  name: string;
  description: string | null;
  faceValue: string;
  currency: string;
  isSoldOut: boolean;
  isAvailable: boolean;
  externalId: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  description: string | null;
  /** @format date-time */
  eventStartDate: string;
  /** @format date-time */
  eventEndDate: string;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  externalUrl: string;
  externalId: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  status: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  images: AdminEventImage[];
  ticketWaves: AdminTicketWave[];
}

export interface PaginatedAdminEventsResponse {
  data: AdminEvent[];
  pagination: {
    hasPrev: boolean;
    hasNext: boolean;
    /** @format double */
    totalPages: number;
    /** @format double */
    total: number;
    /** @format double */
    limit: number;
    /** @format double */
    page: number;
  };
}

export type GetEventsResponse = PaginatedAdminEventsResponse;

export interface InferTypeofAdminEventsQuerySchema {
  status?: "active" | "inactive";
  search?: string;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  includePast: boolean;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type AdminEventsQuery = InferTypeofAdminEventsQuerySchema;

export interface AdminEventDetail {
  id: string;
  name: string;
  description: string | null;
  /** @format date-time */
  eventStartDate: string;
  /** @format date-time */
  eventEndDate: string;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  externalUrl: string;
  externalId: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  status: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  images: AdminEventImage[];
  ticketWaves: AdminTicketWave[];
  metadata: any;
  /** @format date-time */
  lastScrapedAt: string;
}

export type GetEventDetailsResponse = AdminEventDetail;

export interface UpdatedEvent {
  id: string;
  name: string;
  description: string | null;
  /** @format date-time */
  eventStartDate: string;
  /** @format date-time */
  eventEndDate: string;
  venueId: string | null;
  externalUrl: string;
  externalId: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  status: string;
  metadata: any;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  lastScrapedAt: string;
  /** @format date-time */
  deletedAt: string | null;
}

export type UpdateEventResponse = UpdatedEvent;

export interface UpdateEventRouteBody {
  status?: "active" | "inactive";
  qrAvailabilityTiming?: "12h" | "24h" | "3h" | "48h" | "6h" | "72h" | null;
  externalUrl?: string;
  eventEndDate?: string;
  eventStartDate?: string;
  description?: string | null;
  name?: string;
}

export interface DeletedEvent {
  id: string;
  name: string;
  description: string | null;
  /** @format date-time */
  eventStartDate: string;
  /** @format date-time */
  eventEndDate: string;
  venueId: string | null;
  externalUrl: string;
  externalId: string;
  platform: string;
  qrAvailabilityTiming: string | null;
  status: string;
  metadata: any;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  lastScrapedAt: string;
  /** @format date-time */
  deletedAt: string | null;
}

export type DeleteEventResponse = DeletedEvent;

export interface CreatedTicketWave {
  id: string;
  eventId: string;
  externalId: string;
  name: string;
  description: string | null;
  faceValue: string;
  currency: string;
  isSoldOut: boolean;
  isAvailable: boolean;
  status: string;
  metadata: any;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  lastScrapedAt: string;
  /** @format date-time */
  deletedAt: string | null;
}

export type CreateTicketWaveResponse = CreatedTicketWave;

export interface CreateTicketWaveRouteBody {
  externalId?: string;
  description?: string | null;
  isAvailable: boolean;
  isSoldOut: boolean;
  currency: "USD" | "UYU";
  /** @format double */
  faceValue: number;
  name: string;
}

export interface UpdatedTicketWave {
  id: string;
  eventId: string;
  externalId: string;
  name: string;
  description: string | null;
  faceValue: string;
  currency: string;
  isSoldOut: boolean;
  isAvailable: boolean;
  status: string;
  metadata: any;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  lastScrapedAt: string;
  /** @format date-time */
  deletedAt: string | null;
}

export type UpdateTicketWaveResponse = UpdatedTicketWave;

export interface UpdateTicketWaveRouteBody {
  isAvailable?: boolean;
  isSoldOut?: boolean;
  currency?: "USD" | "UYU";
  /** @format double */
  faceValue?: number;
  description?: string | null;
  name?: string;
}

export interface DeletedTicketWave {
  id: string;
  eventId: string;
  externalId: string;
  name: string;
  description: string | null;
  faceValue: string;
  currency: string;
  isSoldOut: boolean;
  isAvailable: boolean;
  status: string;
  metadata: any;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  lastScrapedAt: string;
  /** @format date-time */
  deletedAt: string | null;
}

export type DeleteTicketWaveResponse = DeletedTicketWave;

export interface UploadImageResponse {
  id: string;
  url: string;
  imageType: string;
}

export type UploadEventImageResponse = UploadImageResponse;

export interface DeleteImageResponse {
  success: boolean;
}

export type DeleteEventImageResponse = DeleteImageResponse;

export interface GetCurrentUserResponse {
  /** Reason for manual review rejection (if rejected by admin) */
  rejectionReason: string | null;
  /** Whether user can retry liveness (has attempts remaining and is in a retryable state) */
  canRetryLiveness: boolean;
  /**
   * Number of verification attempts used (max 5)
   * @format double
   */
  verificationAttempts: number;
  /** Whether document verification step was completed successfully (text/face detected) */
  documentVerificationCompleted: boolean;
  /** Whether document has been uploaded (step 2 completed) */
  hasDocumentImage: boolean;
  /** Session ID for resuming liveness check on another device */
  verificationSessionId: string | null;
  documentCountry: string | null;
  documentNumber: string | null;
  documentType: "ci_uy" | "dni_ar" | "passport" | null;
  verificationStatus:
    | "pending"
    | "completed"
    | "requires_manual_review"
    | "failed"
    | "rejected"
    | null;
  documentVerified: boolean;
  role: "user" | "organizer" | "admin";
  imageUrl: string | null;
  lastName: string | null;
  firstName: string | null;
  email: string;
  id: string;
}

export interface DLocalWebhookrRouteBody {
  payment_id: string;
}

export interface ClerkWebhookRouteBody {
  event_attributes?: {
    http_request?: {
      user_agent?: string | null;
      client_ip?: string | null;
    };
  };
  /** @format double */
  timestamp: number;
  instance_id: string;
  data: {
    user_id?: string | null;
    reply_to_email_name?: string | null;
    email_address_id?: string | null;
    data: {
      user?: {
        public_metadata_fallback?: string | null;
        public_metadata?: RecordStringUnknown | null;
        email_address?: string | null;
      };
      theme?: {
        show_clerk_branding?: boolean | null;
        button_text_color?: string | null;
        primary_color?: string | null;
      };
      app?: {
        url?: string | null;
        logo_url?: string | null;
        logo_image_url?: string | null;
        domain_name?: string | null;
        name?: string | null;
      };
      support_email?: string | null;
      revoke_session_url?: string | null;
      session_created_at?: string | null;
      ip_address?: string | null;
      location?: string | null;
      operating_system?: string | null;
      browser_name?: string | null;
      device_type?: string | null;
      sign_in_method?: string | null;
      new_email_address?: string | null;
      primary_email_address?: string | null;
      greeting_name?: string | null;
      invitation?: {
        public_metadata_fallback?: string | null;
        public_metadata?: RecordStringUnknown | null;
        /** @format double */
        expires_in_days?: number | null;
      };
      action_url?: string | null;
      inviter_name?: string | null;
      requested_by?: string | null;
      requested_from?: string | null;
      requested_at?: string | null;
      otp_code?: string | null;
    };
    from_email_name: string;
    delivered_by_clerk: boolean;
    status: string;
    slug: string;
    body_plain: string;
    body: string;
    subject: string;
    to_email_address: string;
    object: "email";
    id: string;
  };
  type: "email.created";
  object: "event";
}

export interface UserCreateCaseResponse {
  source: "auto_missing_document" | "user_report";
  reportedByUserId: string | null;
  entityType: TicketReportEntityType;
  entityId: string;
  /** @format date-time */
  closedAt: string | null;
  caseType: TicketReportCaseType;
  /** @format date-time */
  updatedAt: string;
  status: "awaiting_customer" | "awaiting_support" | "closed";
  id: string;
  description: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface ConflictError {
  name: string;
  message: string;
  stack?: string;
  /** @format double */
  statusCode: number;
  isOperational: boolean;
  /** Construct a type with a set of properties K of type T */
  metadata?: RecordStringAny;
}

export interface CreateTicketReportBody {
  description?: string;
  entityId: string;
  entityType:
    | "listing"
    | "listing_ticket"
    | "order"
    | "order_ticket_reservation";
  caseType:
    | "other"
    | "invalid_ticket"
    | "problem_with_seller"
    | "ticket_not_received";
}

export interface PaginatedResponseCreatedAtDateDescriptionStringOrNullIdStringStatusAwaitingCustomerOrAwaitingSupportOrClosedUpdatedAtDateCaseTypeTicketReportCaseTypeClosedAtDateOrNullEntityIdStringEntityTypeTicketReportEntityTypeReportedByUserIdStringOrNullSourceAutoMissingDocumentOrUserReport {
  data: {
    source: "auto_missing_document" | "user_report";
    reportedByUserId: string | null;
    entityType: TicketReportEntityType;
    entityId: string;
    /** @format date-time */
    closedAt: string | null;
    caseType: TicketReportCaseType;
    /** @format date-time */
    updatedAt: string;
    status: "awaiting_customer" | "awaiting_support" | "closed";
    id: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
  }[];
  pagination: PaginationMeta;
}

export type UserListMyCasesResponse =
  PaginatedResponseCreatedAtDateDescriptionStringOrNullIdStringStatusAwaitingCustomerOrAwaitingSupportOrClosedUpdatedAtDateCaseTypeTicketReportCaseTypeClosedAtDateOrNullEntityIdStringEntityTypeTicketReportEntityTypeReportedByUserIdStringOrNullSourceAutoMissingDocumentOrUserReport;

export type CheckExistingReportResponse =
  | {
      status: "awaiting_customer" | "awaiting_support" | "closed";
      reportId: string;
      exists: true;
    }
  | {
      status?: any;
      reportId?: any;
      exists: false;
    };

export interface UserGetCaseDetailsResponse {
  entityDetails: any;
  initialAttachments: {
    /** @format date-time */
    createdAt: string;
    /** @format double */
    sizeBytes: number;
    mimeType: string;
    originalName: string;
    fileName: string;
    id: string;
  }[];
  actions: {
    attachments: {
      /** @format date-time */
      createdAt: string;
      /** @format double */
      sizeBytes: number;
      mimeType: string;
      originalName: string;
      fileName: string;
      id: string;
    }[];
    /** @format date-time */
    createdAt: string;
    metadata: any;
    comment: string | null;
    actionType: TicketReportActionType;
    performedByAdmin: boolean;
    performedByUserId: string;
    ticketReportId: string;
    id: string;
  }[];
  reporter: {
    email: string;
    lastName: string | null;
    firstName: string | null;
  };
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  closedAt: string | null;
  source: TicketReportSource;
  description: string | null;
  reportedByUserId: string | null;
  entityId: string;
  entityType: TicketReportEntityType;
  caseType: TicketReportCaseType;
  status: TicketReportStatus;
  id: string;
}

export interface UserAddActionResponse {
  action: {
    ticketReportId: string;
    performedByUserId: string;
    performedByAdmin: boolean;
    comment: string | null;
    actionType: TicketReportActionType;
    metadata: JsonValue;
    id: string;
    /** @format date-time */
    createdAt: string;
  };
  report: {
    source: "auto_missing_document" | "user_report";
    reportedByUserId: string | null;
    entityType: TicketReportEntityType;
    entityId: string;
    /** @format date-time */
    closedAt: string | null;
    caseType: TicketReportCaseType;
    /** @format date-time */
    updatedAt: string;
    status: "awaiting_customer" | "awaiting_support" | "closed";
    id: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
  };
}

export interface AddUserActionBody {
  comment?: string;
  actionType: "comment" | "close";
}

export interface UserCloseCaseResponse {
  action: {
    ticketReportId: string;
    performedByUserId: string;
    performedByAdmin: boolean;
    comment: string | null;
    actionType: TicketReportActionType;
    metadata: JsonValue;
    id: string;
    /** @format date-time */
    createdAt: string;
  };
  report: {
    source: "auto_missing_document" | "user_report";
    reportedByUserId: string | null;
    entityType: TicketReportEntityType;
    entityId: string;
    /** @format date-time */
    closedAt: string | null;
    caseType: TicketReportCaseType;
    /** @format date-time */
    updatedAt: string;
    status: "awaiting_customer" | "awaiting_support" | "closed";
    id: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
  };
}

export interface UploadAttachmentResponse {
  uploadedByUserId: string;
  ticketReportActionId: string | null;
  ticketReportId: string;
  storagePath: string;
  /** @format double */
  sizeBytes: number;
  originalName: string;
  mimeType: string;
  fileName: string;
  id: string;
  /** @format date-time */
  createdAt: string;
}

export type ListAttachmentsResponse = {
  uploadedByUserId: string;
  ticketReportActionId: string | null;
  ticketReportId: string;
  storagePath: string;
  /** @format double */
  sizeBytes: number;
  originalName: string;
  mimeType: string;
  fileName: string;
  id: string;
  /** @format date-time */
  createdAt: string;
  url: string;
}[];

export interface GetAttachmentUrlResponse {
  url: string;
}

export interface UpdateProfileResponse {
  lastName: string | null;
  firstName: string | null;
}

/**
 * API Error Response - This is the actual shape returned by the error handler middleware.
 * Use this type in
 */
export interface ApiErrorResponse {
  /** The error class name (e.g., 'ValidationError', 'UnauthorizedError') */
  error: ErrorClassName;
  /** Human-readable error message */
  message: string;
  /**
   * HTTP status code
   * @format double
   */
  statusCode: number;
  /** ISO timestamp of when the error occurred */
  timestamp: string;
  /** Request path that caused the error */
  path: string;
  /** HTTP method of the request */
  method: string;
  /** Additional metadata (e.g., for validation errors) */
  metadata?: RecordStringUnknown;
}

export interface UpdateProfileRouteBody {
  lastName: string;
  firstName: string;
}

export interface UploadProfileImageResponse {
  imageUrl: string;
}

export interface DeleteProfileImageResponse {
  success: boolean;
}

export type GetEmailsResponse = {
  verification: {
    status: string;
  } | null;
  isPrimary: boolean;
  emailAddress: string;
  id: string;
}[];

export interface AddEmailResponse {
  emailAddress: string;
  emailAddressId: string;
}

export interface AddEmailRouteBody {
  emailAddress: string;
}

export interface VerifyEmailResponse {
  success: boolean;
}

export interface VerifyEmailRouteBody {
  code: string;
  emailAddressId: string;
}

export interface SetPrimaryEmailResponse {
  success: boolean;
}

export interface SetPrimaryEmailRouteBody {
  emailAddressId: string;
}

export interface DeleteEmailResponse {
  success: boolean;
}

export type GetExternalAccountsResponse = {
  imageUrl: string;
  lastName: string;
  firstName: string;
  emailAddress: string;
  provider: string;
  id: string;
}[];

export interface GetPasswordStatusResponse {
  hasPassword: boolean;
}

export interface SetPasswordResponse {
  success: boolean;
}

export interface SetPasswordRouteBody {
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
}

export interface ChangePasswordRouteBody {
  newPassword: string;
  currentPassword: string;
}

export type GetSessionsResponse = {
  latestActivity: {
    isMobile: boolean;
    country?: string;
    city?: string;
    ipAddress?: string;
    deviceType?: string;
    browserVersion?: string;
    browserName?: string;
  } | null;
  status: string;
  /** @format double */
  expireAt: number;
  /** @format double */
  lastActiveAt: number;
  clientId: string;
  id: string;
}[];

export interface RevokeSessionResponse {
  success: boolean;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export interface DeleteAccountRouteBody {
  confirmation: "ELIMINAR";
}

export interface CreatePaymentLinkResponse {
  redirectUrl: string;
  paymentId: string;
}

export interface CreatePaymentLinkRouteBody {
  country?: string;
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
  userId: string;
  channelStatus: string | number | boolean | JsonArray | JsonObject | null;
  /** @format double */
  retryCount: number;
  /** @format date-time */
  seenAt: string | null;
  sendViaJob: boolean;
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

export interface InferTypeofBaseActionSchema {
  /** Construct a type with a set of properties K of type T */
  data?: RecordStringUnknown;
  url?: string;
  label: string;
  type:
    | "upload_documents"
    | "view_order"
    | "retry_payment"
    | "view_payout"
    | "start_verification"
    | "publish_tickets"
    | "view_earnings"
    | "view_report";
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

export interface InitiateVerificationResponse {
  message: "Verificación iniciada";
  success: boolean;
}

export interface InitiateVerificationRouteBody {
  documentCountry?: string;
  documentNumber: string;
  documentType: "ci_uy" | "dni_ar" | "passport";
}

export interface ProcessDocumentResponse {
  documentIdMatch: boolean;
  verificationStatus: "pending" | "requires_manual_review";
  readyForLiveness: boolean;
  extractedDocumentId: string;
}

export interface CreateLivenessCheckResponse {
  /** @format double */
  attemptsRemaining: number;
  /** @format double */
  expiresInSeconds: number;
  region: string;
  sessionId?: string;
}

export interface VerifyLivenessResultsResponse {
  /** @format double */
  retriesRemaining?: number;
  canRetry?: boolean;
  message?: string;
  status: IdentityVerificationStatus;
  verified: boolean;
}

export interface VerifyLivenessRouteBody {
  sessionId: string;
}

export interface PaginatedResponseCreatedAtDateDescriptionStringOrNullIdStringStatusAwaitingCustomerOrAwaitingSupportOrClosedUpdatedAtDateCaseTypeTicketReportCaseTypeClosedAtDateOrNullEntityIdStringEntityTypeTicketReportEntityTypeReportedByUserIdStringOrNullSourceAutoMissingDocumentOrUserReportReporterEmailStringOrNullReporterFirstNameStringOrNullReporterLastNameStringOrNull {
  data: {
    reporterLastName: string | null;
    reporterFirstName: string | null;
    reporterEmail: string | null;
    source: "auto_missing_document" | "user_report";
    reportedByUserId: string | null;
    entityType: TicketReportEntityType;
    entityId: string;
    /** @format date-time */
    closedAt: string | null;
    caseType: TicketReportCaseType;
    /** @format date-time */
    updatedAt: string;
    status: "awaiting_customer" | "awaiting_support" | "closed";
    id: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
  }[];
  pagination: PaginationMeta;
}

export type AdminListCasesResponse =
  PaginatedResponseCreatedAtDateDescriptionStringOrNullIdStringStatusAwaitingCustomerOrAwaitingSupportOrClosedUpdatedAtDateCaseTypeTicketReportCaseTypeClosedAtDateOrNullEntityIdStringEntityTypeTicketReportEntityTypeReportedByUserIdStringOrNullSourceAutoMissingDocumentOrUserReportReporterEmailStringOrNullReporterFirstNameStringOrNullReporterLastNameStringOrNull;

export interface InferTypeofAdminListTicketReportsQuerySchema {
  caseType?:
    | "other"
    | "invalid_ticket"
    | "problem_with_seller"
    | "ticket_not_received";
  status?: "awaiting_customer" | "awaiting_support" | "closed";
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type AdminListTicketReportsQuery =
  InferTypeofAdminListTicketReportsQuerySchema;

export interface AdminGetCaseDetailsResponse {
  entityDetails: any;
  initialAttachments: {
    /** @format date-time */
    createdAt: string;
    /** @format double */
    sizeBytes: number;
    mimeType: string;
    originalName: string;
    fileName: string;
    id: string;
  }[];
  actions: {
    attachments: {
      /** @format date-time */
      createdAt: string;
      /** @format double */
      sizeBytes: number;
      mimeType: string;
      originalName: string;
      fileName: string;
      id: string;
    }[];
    /** @format date-time */
    createdAt: string;
    metadata: any;
    comment: string | null;
    actionType: TicketReportActionType;
    performedByAdmin: boolean;
    performedByUserId: string;
    ticketReportId: string;
    id: string;
  }[];
  reporter: {
    email: string;
    lastName: string | null;
    firstName: string | null;
  };
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  closedAt: string | null;
  source: TicketReportSource;
  description: string | null;
  reportedByUserId: string | null;
  entityId: string;
  entityType: TicketReportEntityType;
  caseType: TicketReportCaseType;
  status: TicketReportStatus;
  id: string;
}

export interface AdminAddActionResponse {
  action: {
    ticketReportId: string;
    performedByUserId: string;
    performedByAdmin: boolean;
    comment: string | null;
    actionType: TicketReportActionType;
    metadata: JsonValue;
    id: string;
    /** @format date-time */
    createdAt: string;
  };
  report: {
    source: "auto_missing_document" | "user_report";
    reportedByUserId: string | null;
    entityType: TicketReportEntityType;
    entityId: string;
    /** @format date-time */
    closedAt: string | null;
    caseType: TicketReportCaseType;
    /** @format date-time */
    updatedAt: string;
    status: "awaiting_customer" | "awaiting_support" | "closed";
    id: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
  };
}

export interface AddAdminActionBody {
  metadata?: {
    reservationIds?: string[];
    refundReason?: string;
    /** @format double */
    refundAmount?: number;
  };
  comment?: string;
  actionType: "comment" | "close" | "refund_full" | "refund_partial" | "reject";
}

export interface AdminUploadAttachmentResponse {
  uploadedByUserId: string;
  ticketReportActionId: string | null;
  ticketReportId: string;
  storagePath: string;
  /** @format double */
  sizeBytes: number;
  originalName: string;
  mimeType: string;
  fileName: string;
  id: string;
  /** @format date-time */
  createdAt: string;
}

export type AdminListAttachmentsResponse = {
  uploadedByUserId: string;
  ticketReportActionId: string | null;
  ticketReportId: string;
  storagePath: string;
  /** @format double */
  sizeBytes: number;
  originalName: string;
  mimeType: string;
  fileName: string;
  id: string;
  /** @format date-time */
  createdAt: string;
  url: string;
}[];

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
        /** Filter by city name */
        city?: string;
        /** Filter by region/state/departamento name */
        region?: string;
        /**
         * Latitude for proximity search (requires lng)
         * @format double
         */
        lat?: number;
        /**
         * Longitude for proximity search (requires lat)
         * @format double
         */
        lng?: number;
        /**
         * Radius in km for proximity search (default: 30)
         * @format double
         */
        radiusKm?: number;
        /** Filter events starting from this date (ISO format) */
        dateFrom?: string;
        /** Filter events ending before this date (ISO format) */
        dateTo?: string;
        /** Only show events with at least one available ticket */
        hasTickets?: boolean;
        /**
         * User timezone offset in minutes from UTC (e.g. 180 for UTC-3)
         * @format double
         */
        tzOffset?: number;
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
     * @description Get trending events based on view count in the last N days
     *
     * @tags Events
     * @name GetTrendingEvents
     * @request GET:/events/trending
     */
    getTrendingEvents: (
      query?: {
        /** @format double */
        days?: number;
        /** @format double */
        limit?: number;
        region?: string;
        /** @format double */
        lat?: number;
        /** @format double */
        lng?: number;
        /** @format double */
        radiusKm?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetTrendingEventsResponse, any>({
        path: `/events/trending`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Get list of distinct cities for filter dropdown
     *
     * @tags Events
     * @name GetDistinctCities
     * @request GET:/events/cities
     */
    getDistinctCities: (params: RequestParams = {}) =>
      this.request<GetDistinctCitiesResponse, any>({
        path: `/events/cities`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get distinct regions with active events, grouped by country
     *
     * @tags Events
     * @name GetDistinctRegions
     * @request GET:/events/regions
     */
    getDistinctRegions: (params: RequestParams = {}) =>
      this.request<GetDistinctRegionsResponse, any>({
        path: `/events/regions`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Get event details by slug (public, used by frontend)
     *
     * @tags Events
     * @name GetBySlug
     * @request GET:/events/by-slug/{slug}
     */
    getBySlug: (slug: string, params: RequestParams = {}) =>
      this.request<GetEventBySlugResponse, any>({
        path: `/events/by-slug/${slug}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Track a view for an event by slug (called from route loader on actual navigation)
     *
     * @tags Events
     * @name TrackViewBySlug
     * @request POST:/events/by-slug/{slug}/view
     */
    trackViewBySlug: (slug: string, params: RequestParams = {}) =>
      this.request<TrackViewResponse, any>({
        path: `/events/by-slug/${slug}/view`,
        method: "POST",
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

    /**
     * @description Track a view for an event (called from route loader on actual navigation, not prefetch)
     *
     * @tags Events
     * @name TrackView
     * @request POST:/events/{eventId}/view
     */
    trackView: (eventId: string, params: RequestParams = {}) =>
      this.request<TrackViewResponse, any>({
        path: `/events/${eventId}/view`,
        method: "POST",
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
    create: (
      data: {
        eventId: string;
        ticketWaveId: string;
        /** @format double */
        price: number;
        /** @format double */
        quantity: number;
        documents?: File[];
      },
      params: RequestParams = {},
    ) =>
      this.request<
        CreateTicketListingResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-listings`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
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

    /**
     * @description Update ticket price Only active tickets (not reserved, sold, or cancelled) can have their price updated. Price cannot exceed the ticket wave face value.
     *
     * @tags Ticket Listings
     * @name UpdateTicketPrice
     * @request PUT:/ticket-listings/tickets/{ticketId}/price
     */
    updateTicketPrice: (
      ticketId: string,
      data: UpdateTicketPriceRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        UpdateTicketPriceResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-listings/tickets/${ticketId}/price`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove a ticket from listing Only active tickets (not reserved, sold, or cancelled) can be removed. This performs a soft delete (sets deletedAt timestamp).
     *
     * @tags Ticket Listings
     * @name RemoveTicket
     * @request DELETE:/ticket-listings/tickets/{ticketId}
     */
    removeTicket: (ticketId: string, params: RequestParams = {}) =>
      this.request<
        RemoveTicketResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-listings/tickets/${ticketId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description Get ticket information with document details Returns ticket info including document URL for viewing. Only the seller (ticket publisher) can access this endpoint.
     *
     * @tags Ticket Listings
     * @name GetTicketInfo
     * @request GET:/ticket-listings/tickets/{ticketId}/info
     */
    getTicketInfo: (ticketId: string, params: RequestParams = {}) =>
      this.request<GetTicketInfoResponse, UnauthorizedError | NotFoundError>({
        path: `/ticket-listings/tickets/${ticketId}/info`,
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

    /**
     * No description
     *
     * @tags Orders
     * @name CancelOrder
     * @request POST:/orders/{orderId}/cancel
     */
    cancelOrder: (orderId: string, params: RequestParams = {}) =>
      this.request<
        CancelOrderResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/orders/${orderId}/cancel`,
        method: "POST",
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

    /**
     * No description
     *
     * @tags Payouts
     * @name GetPayoutDetails
     * @request GET:/payouts/{payoutId}
     */
    getPayoutDetails: (payoutId: string, params: RequestParams = {}) =>
      this.request<
        GetUserPayoutDetailsResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/payouts/${payoutId}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  admin = {
    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name GetPayouts
     * @request GET:/admin/payouts
     */
    getPayouts: (
      query: {
        status?: "cancelled" | "pending" | "completed" | "failed";
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetPayoutsResponse, UnauthorizedError>({
        path: `/admin/payouts`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name GetPayoutDetails
     * @request GET:/admin/payouts/{payoutId}
     */
    getPayoutDetails: (payoutId: string, params: RequestParams = {}) =>
      this.request<GetPayoutDetailsResponse, UnauthorizedError | NotFoundError>(
        {
          path: `/admin/payouts/${payoutId}`,
          method: "GET",
          format: "json",
          ...params,
        },
      ),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name UpdatePayout
     * @request PUT:/admin/payouts/{payoutId}
     */
    updatePayout: (
      payoutId: string,
      data: UpdatePayoutRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        UpdatePayoutResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/payouts/${payoutId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name ProcessPayout
     * @request POST:/admin/payouts/{payoutId}/process
     */
    processPayout: (
      payoutId: string,
      data: ProcessPayoutRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        ProcessPayoutResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/payouts/${payoutId}/process`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name CompletePayout
     * @request POST:/admin/payouts/{payoutId}/complete
     */
    completePayout: (
      payoutId: string,
      data: CompletePayoutRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        CompletePayoutResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/payouts/${payoutId}/complete`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name FailPayout
     * @request POST:/admin/payouts/{payoutId}/fail
     */
    failPayout: (
      payoutId: string,
      data: FailPayoutRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        FailPayoutResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/payouts/${payoutId}/fail`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name CancelPayout
     * @request POST:/admin/payouts/{payoutId}/cancel
     */
    cancelPayout: (
      payoutId: string,
      data: CancelPayoutRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        CancelPayoutResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/payouts/${payoutId}/cancel`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name UploadPayoutDocument
     * @request POST:/admin/payouts/{payoutId}/documents
     */
    uploadPayoutDocument: (
      payoutId: string,
      data: {
        /** @format binary */
        file: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        UploadPayoutDocumentResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/payouts/${payoutId}/documents`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Payouts
     * @name DeletePayoutDocument
     * @request DELETE:/admin/payouts/documents/{documentId}
     */
    deletePayoutDocument: (documentId: string, params: RequestParams = {}) =>
      this.request<
        DeletePayoutDocumentResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/admin/payouts/documents/${documentId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Identity Verification
     * @name GetVerifications
     * @request GET:/admin/identity-verification
     */
    getVerifications: (
      query: {
        status?:
          | "pending"
          | "completed"
          | "failed"
          | "rejected"
          | "requires_manual_review";
        sortOrder?: "asc" | "desc";
        sortBy: "createdAt" | "updatedAt" | "verificationAttempts";
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetVerificationsResponse, UnauthorizedError>({
        path: `/admin/identity-verification`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Identity Verification
     * @name GetVerificationDetails
     * @request GET:/admin/identity-verification/{userId}
     */
    getVerificationDetails: (userId: string, params: RequestParams = {}) =>
      this.request<
        GetVerificationDetailsResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/admin/identity-verification/${userId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Identity Verification
     * @name GetVerificationImage
     * @request GET:/admin/identity-verification/{userId}/images/{imageType}
     */
    getVerificationImage: (
      userId: string,
      imageType: "document" | "reference" | "audit",
      query?: {
        index?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetVerificationImageUrlResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/admin/identity-verification/${userId}/images/${imageType}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Identity Verification
     * @name ApproveVerification
     * @request POST:/admin/identity-verification/{userId}/approve
     */
    approveVerification: (
      userId: string,
      data: ApproveVerificationRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        ApproveVerificationResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/identity-verification/${userId}/approve`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Identity Verification
     * @name RejectVerification
     * @request POST:/admin/identity-verification/{userId}/reject
     */
    rejectVerification: (
      userId: string,
      data: RejectVerificationRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        RejectVerificationResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/identity-verification/${userId}/reject`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Identity Verification
     * @name GetVerificationAuditHistory
     * @request GET:/admin/identity-verification/{userId}/audit-history
     */
    getVerificationAuditHistory: (
      userId: string,
      query?: {
        offset?: string;
        limit?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        GetVerificationAuditHistoryResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/admin/identity-verification/${userId}/audit-history`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name GetEvents
     * @request GET:/admin/events
     */
    getEvents: (
      query: {
        status?: "active" | "inactive";
        search?: string;
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        includePast: boolean;
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetEventsResponse, UnauthorizedError>({
        path: `/admin/events`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name GetEventDetails
     * @request GET:/admin/events/{eventId}
     */
    getEventDetails: (eventId: string, params: RequestParams = {}) =>
      this.request<GetEventDetailsResponse, UnauthorizedError | NotFoundError>({
        path: `/admin/events/${eventId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name UpdateEvent
     * @request PUT:/admin/events/{eventId}
     */
    updateEvent: (
      eventId: string,
      data: UpdateEventRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        UpdateEventResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/events/${eventId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name DeleteEvent
     * @request DELETE:/admin/events/{eventId}
     */
    deleteEvent: (eventId: string, params: RequestParams = {}) =>
      this.request<DeleteEventResponse, UnauthorizedError | NotFoundError>({
        path: `/admin/events/${eventId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name CreateTicketWave
     * @request POST:/admin/events/{eventId}/ticket-waves
     */
    createTicketWave: (
      eventId: string,
      data: CreateTicketWaveRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        CreateTicketWaveResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/events/${eventId}/ticket-waves`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name UpdateTicketWave
     * @request PUT:/admin/events/{eventId}/ticket-waves/{waveId}
     */
    updateTicketWave: (
      eventId: string,
      waveId: string,
      data: UpdateTicketWaveRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        UpdateTicketWaveResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/events/${eventId}/ticket-waves/${waveId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name DeleteTicketWave
     * @request DELETE:/admin/events/{eventId}/ticket-waves/{waveId}
     */
    deleteTicketWave: (
      eventId: string,
      waveId: string,
      params: RequestParams = {},
    ) =>
      this.request<DeleteTicketWaveResponse, UnauthorizedError | NotFoundError>(
        {
          path: `/admin/events/${eventId}/ticket-waves/${waveId}`,
          method: "DELETE",
          format: "json",
          ...params,
        },
      ),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name UploadEventImage
     * @request POST:/admin/events/{eventId}/images
     */
    uploadEventImage: (
      eventId: string,
      data: {
        /** @format binary */
        file: File;
        imageType: "flyer" | "hero";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        UploadEventImageResponse,
        BadRequestError | UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/events/${eventId}/images`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Events
     * @name DeleteEventImage
     * @request DELETE:/admin/events/{eventId}/images/{imageId}
     */
    deleteEventImage: (
      eventId: string,
      imageId: string,
      params: RequestParams = {},
    ) =>
      this.request<DeleteEventImageResponse, UnauthorizedError | NotFoundError>(
        {
          path: `/admin/events/${eventId}/images/${imageId}`,
          method: "DELETE",
          format: "json",
          ...params,
        },
      ),

    /**
     * No description
     *
     * @tags Admin - Ticket Reports
     * @name ListCases
     * @request GET:/admin/ticket-reports
     */
    listCases: (
      query: {
        caseType?:
          | "other"
          | "invalid_ticket"
          | "problem_with_seller"
          | "ticket_not_received";
        status?: "awaiting_customer" | "awaiting_support" | "closed";
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        /** @format double */
        limit: number;
        /** @format double */
        page: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AdminListCasesResponse, UnauthorizedError>({
        path: `/admin/ticket-reports`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Ticket Reports
     * @name GetCaseDetails
     * @request GET:/admin/ticket-reports/{reportId}
     */
    getCaseDetails: (reportId: string, params: RequestParams = {}) =>
      this.request<
        AdminGetCaseDetailsResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/admin/ticket-reports/${reportId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Ticket Reports
     * @name AddAction
     * @request POST:/admin/ticket-reports/{reportId}/actions
     */
    addAction: (
      reportId: string,
      data: AddAdminActionBody,
      params: RequestParams = {},
    ) =>
      this.request<
        AdminAddActionResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/ticket-reports/${reportId}/actions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Ticket Reports
     * @name UploadAttachment
     * @request POST:/admin/ticket-reports/{reportId}/attachments
     */
    uploadAttachment: (
      reportId: string,
      data: {
        /** @format binary */
        file: File;
      },
      query?: {
        actionId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        AdminUploadAttachmentResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/admin/ticket-reports/${reportId}/attachments`,
        method: "POST",
        query: query,
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Admin - Ticket Reports
     * @name ListAttachments
     * @request GET:/admin/ticket-reports/{reportId}/attachments
     */
    listAttachments: (reportId: string, params: RequestParams = {}) =>
      this.request<
        AdminListAttachmentsResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/admin/ticket-reports/${reportId}/attachments`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags Users
     * @name GetCurrentUser
     * @request GET:/users/me
     */
    getCurrentUser: (params: RequestParams = {}) =>
      this.request<GetCurrentUserResponse, UnauthorizedError>({
        path: `/users/me`,
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

    /**
     * @description Receives authentication events from Clerk
     *
     * @tags Webhooks
     * @name HandleClerkWebhook
     * @summary Clerk authentication webhook
     * @request POST:/webhooks/clerk
     */
    handleClerkWebhook: (
      data: ClerkWebhookRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          received: boolean;
        },
        any
      >({
        path: `/webhooks/clerk`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  ticketReports = {
    /**
     * No description
     *
     * @tags Ticket Reports
     * @name CreateCase
     * @request POST:/ticket-reports
     */
    createCase: (data: CreateTicketReportBody, params: RequestParams = {}) =>
      this.request<UserCreateCaseResponse, ConflictError | ValidationError>({
        path: `/ticket-reports`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name ListMyCases
     * @request GET:/ticket-reports
     */
    listMyCases: (params: RequestParams = {}) =>
      this.request<UserListMyCasesResponse, any>({
        path: `/ticket-reports`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name CheckExistingReport
     * @request GET:/ticket-reports/check-existing
     */
    checkExistingReport: (
      query: {
        entityType: string;
        entityId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<CheckExistingReportResponse, any>({
        path: `/ticket-reports/check-existing`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name GetCaseDetails
     * @request GET:/ticket-reports/{reportId}
     */
    getCaseDetails: (reportId: string, params: RequestParams = {}) =>
      this.request<
        UserGetCaseDetailsResponse,
        UnauthorizedError | NotFoundError
      >({
        path: `/ticket-reports/${reportId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name AddAction
     * @request POST:/ticket-reports/{reportId}/actions
     */
    addAction: (
      reportId: string,
      data: AddUserActionBody,
      params: RequestParams = {},
    ) =>
      this.request<
        UserAddActionResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-reports/${reportId}/actions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name CloseCase
     * @request POST:/ticket-reports/{reportId}/close
     */
    closeCase: (reportId: string, params: RequestParams = {}) =>
      this.request<
        UserCloseCaseResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-reports/${reportId}/close`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name UploadAttachment
     * @request POST:/ticket-reports/{reportId}/attachments
     */
    uploadAttachment: (
      reportId: string,
      data: {
        /** @format binary */
        file: File;
      },
      query?: {
        actionId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        UploadAttachmentResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/ticket-reports/${reportId}/attachments`,
        method: "POST",
        query: query,
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name ListAttachments
     * @request GET:/ticket-reports/{reportId}/attachments
     */
    listAttachments: (reportId: string, params: RequestParams = {}) =>
      this.request<ListAttachmentsResponse, UnauthorizedError | NotFoundError>({
        path: `/ticket-reports/${reportId}/attachments`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Ticket Reports
     * @name GetAttachmentUrl
     * @request GET:/ticket-reports/{reportId}/attachments/{attachmentId}/url
     */
    getAttachmentUrl: (
      reportId: string,
      attachmentId: string,
      params: RequestParams = {},
    ) =>
      this.request<GetAttachmentUrlResponse, UnauthorizedError | NotFoundError>(
        {
          path: `/ticket-reports/${reportId}/attachments/${attachmentId}/url`,
          method: "GET",
          format: "json",
          ...params,
        },
      ),
  };
  profile = {
    /**
     * No description
     *
     * @tags Profile
     * @name UpdateProfile
     * @request PUT:/profile
     */
    updateProfile: (data: UpdateProfileRouteBody, params: RequestParams = {}) =>
      this.request<UpdateProfileResponse, ApiErrorResponse>({
        path: `/profile`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name UploadProfileImage
     * @request PUT:/profile/image
     */
    uploadProfileImage: (
      data: {
        /** @format binary */
        file: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<UploadProfileImageResponse, ApiErrorResponse>({
        path: `/profile/image`,
        method: "PUT",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name DeleteProfileImage
     * @request DELETE:/profile/image
     */
    deleteProfileImage: (params: RequestParams = {}) =>
      this.request<DeleteProfileImageResponse, ApiErrorResponse>({
        path: `/profile/image`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name GetEmails
     * @request GET:/profile/emails
     */
    getEmails: (params: RequestParams = {}) =>
      this.request<GetEmailsResponse, ApiErrorResponse>({
        path: `/profile/emails`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name AddEmail
     * @request POST:/profile/emails
     */
    addEmail: (data: AddEmailRouteBody, params: RequestParams = {}) =>
      this.request<AddEmailResponse, ApiErrorResponse>({
        path: `/profile/emails`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name VerifyEmail
     * @request POST:/profile/emails/verify
     */
    verifyEmail: (data: VerifyEmailRouteBody, params: RequestParams = {}) =>
      this.request<VerifyEmailResponse, ApiErrorResponse>({
        path: `/profile/emails/verify`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name SetPrimaryEmail
     * @request PUT:/profile/emails/primary
     */
    setPrimaryEmail: (
      data: SetPrimaryEmailRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<SetPrimaryEmailResponse, ApiErrorResponse>({
        path: `/profile/emails/primary`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name DeleteEmail
     * @request DELETE:/profile/emails/{emailAddressId}
     */
    deleteEmail: (emailAddressId: string, params: RequestParams = {}) =>
      this.request<DeleteEmailResponse, ApiErrorResponse>({
        path: `/profile/emails/${emailAddressId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name GetExternalAccounts
     * @request GET:/profile/external-accounts
     */
    getExternalAccounts: (params: RequestParams = {}) =>
      this.request<GetExternalAccountsResponse, ApiErrorResponse>({
        path: `/profile/external-accounts`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name GetPasswordStatus
     * @request GET:/profile/password-status
     */
    getPasswordStatus: (params: RequestParams = {}) =>
      this.request<GetPasswordStatusResponse, ApiErrorResponse>({
        path: `/profile/password-status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name SetPassword
     * @request POST:/profile/password
     */
    setPassword: (data: SetPasswordRouteBody, params: RequestParams = {}) =>
      this.request<SetPasswordResponse, ApiErrorResponse>({
        path: `/profile/password`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name ChangePassword
     * @request PUT:/profile/password
     */
    changePassword: (
      data: ChangePasswordRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<ChangePasswordResponse, ApiErrorResponse>({
        path: `/profile/password`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name GetSessions
     * @request GET:/profile/sessions
     */
    getSessions: (params: RequestParams = {}) =>
      this.request<GetSessionsResponse, ApiErrorResponse>({
        path: `/profile/sessions`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name RevokeSession
     * @request DELETE:/profile/sessions/{sessionId}
     */
    revokeSession: (sessionId: string, params: RequestParams = {}) =>
      this.request<RevokeSessionResponse, ApiErrorResponse>({
        path: `/profile/sessions/${sessionId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Profile
     * @name DeleteAccount
     * @request DELETE:/profile/account
     */
    deleteAccount: (data: DeleteAccountRouteBody, params: RequestParams = {}) =>
      this.request<DeleteAccountResponse, ApiErrorResponse>({
        path: `/profile/account`,
        method: "DELETE",
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
    createPaymentLink: (
      orderId: string,
      data: CreatePaymentLinkRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<
        CreatePaymentLinkResponse,
        UnauthorizedError | NotFoundError | ValidationError
      >({
        path: `/payments/create-link/${orderId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
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
  identityVerification = {
    /**
     * @description Initiate identity verification process User provides document type, number, and country (for passports). System validates the document format and checks for duplicates.
     *
     * @tags Identity Verification
     * @name InitiateVerification
     * @request POST:/identity-verification/initiate
     */
    initiateVerification: (
      data: InitiateVerificationRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<InitiateVerificationResponse, ApiErrorResponse>({
        path: `/identity-verification/initiate`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verify document (upload document photo only) Processes uploaded document image: - Extracts text from document - Detects face in document - Validates document number - Determines if manual review is needed Face comparison will happen during liveness check using the liveness reference image
     *
     * @tags Identity Verification
     * @name VerifyDocument
     * @request POST:/identity-verification/verify-document
     */
    verifyDocument: (
      data: {
        /** @format binary */
        file: File;
        documentType: "ci_uy" | "dni_ar" | "passport";
      },
      params: RequestParams = {},
    ) =>
      this.request<ProcessDocumentResponse, ApiErrorResponse>({
        path: `/identity-verification/verify-document`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description Start liveness check session Creates an AWS Rekognition Face Liveness session for the user. Returns session ID and region for the frontend to complete the check.
     *
     * @tags Identity Verification
     * @name StartLiveness
     * @request POST:/identity-verification/start-liveness
     */
    startLiveness: (params: RequestParams = {}) =>
      this.request<CreateLivenessCheckResponse, ApiErrorResponse>({
        path: `/identity-verification/start-liveness`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Verify liveness results Processes the results of the liveness check: - Validates liveness confidence - Determines if verification is complete or requires manual review - Updates user verification status
     *
     * @tags Identity Verification
     * @name VerifyLiveness
     * @request POST:/identity-verification/verify-liveness
     */
    verifyLiveness: (
      data: VerifyLivenessRouteBody,
      params: RequestParams = {},
    ) =>
      this.request<VerifyLivenessResultsResponse, ApiErrorResponse>({
        path: `/identity-verification/verify-liveness`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get temporary AWS credentials for Face Liveness SDK The backend assumes a minimal IAM role that can ONLY call StartFaceLivenessSession. This is more secure than Cognito because credentials are only given to authenticated users. Credentials expire in 15 minutes.
     *
     * @tags Identity Verification
     * @name GetLivenessCredentials
     * @request GET:/identity-verification/liveness-credentials
     */
    getLivenessCredentials: (params: RequestParams = {}) =>
      this.request<
        {
          expiration: string;
          region: string;
          sessionToken: string;
          secretAccessKey: string;
          accessKeyId: string;
        },
        ApiErrorResponse
      >({
        path: `/identity-verification/liveness-credentials`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
