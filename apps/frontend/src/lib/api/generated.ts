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

export enum VerificationStatus {
  Unverified = "unverified",
  Verified = "verified",
  Transferable = "transferable",
  Failed = "failed",
  Expired = "expired",
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

export interface GetEventsPaginatedResponse {
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

export interface InferTypeofPaginationSchema {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit: number;
  /** @format double */
  page: number;
}

export type PaginationQuery = InferTypeofPaginationSchema;

export interface GetEventByIdResponse {
  ticketWaves: {
    isSoldOut: boolean;
    isAvailable: boolean;
    faceValue: string;
    currency: EventTicketCurrency;
    name: string;
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

/**
 * If you want to provide custom types for the user.publicMetadata object,
 * simply redeclare this rule in the global namespace.
 * Every user object will use the provided type.
 */
export type UserPublicMetadata = Record<string, any>;

/**
 * If you want to provide custom types for the user.privateMetadata object,
 * simply redeclare this rule in the global namespace.
 * Every user object will use the provided type.
 */
export type UserPrivateMetadata = Record<string, any>;

/**
 * If you want to provide custom types for the user.unsafeMetadata object,
 * simply redeclare this rule in the global namespace.
 * Every user object will use the provided type.
 */
export type UserUnsafeMetadata = Record<string, any>;

/**
 * The URL interface represents an object providing static methods used for creating object URLs.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL)
 * `URL` class is a global reference for `import { URL } from 'url'`
 * https://nodejs.org/api/url.html#the-whatwg-url-api
 */
export type UrlURL = string;

/** The Backend `Verification` object describes the state of the verification process of a sign-in or sign-up attempt. */
export interface Verification {
  /**
   * The state of the verification.
   *
   * <ul>
   *  <li>`unverified`: The verification has not been verified yet.</li>
   *  <li>`verified`: The verification has been verified.</li>
   *  <li>`transferable`: The verification is transferable to between sign-in and sign-up flows.</li>
   *  <li>`failed`: The verification has failed.</li>
   *  <li>`expired`: The verification has expired.</li>
   * </ul>
   */
  status: VerificationStatus;
  /** The strategy pertaining to the parent sign-up or sign-in attempt. */
  strategy: string;
  /** The redirect URL for an external verification. */
  externalVerificationRedirectURL: UrlURL | null;
  /**
   * The number of attempts related to the verification.
   * @format double
   */
  attempts: number | null;
  /**
   * The time the verification will expire at.
   * @format double
   */
  expireAt: number | null;
  /** The [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) pertaining to the verification. */
  nonce: string | null;
  /** The message that will be presented to the user's Web3 wallet for signing during authentication. This follows the [Sign-In with Ethereum (SIWE) protocol format](https://docs.login.xyz/general-information/siwe-overview/eip-4361#example-message-to-be-signed), which typically includes details like the requesting service, wallet address, terms acceptance, nonce, timestamp, and any additional resources. */
  message: string | null;
}

/** Contains information about any identifications that might be linked to the email address. */
export interface IdentificationLink {
  /** The unique identifier for the identification link. */
  id: string;
  /** The type of the identification link, e.g., `"email_address"`, `"phone_number"`, etc. */
  type: string;
}

/**
 * The Backend `EmailAddress` object is a model around an email address. Email addresses are one of the [identifiers](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options#identifiers) used to provide identification for users.
 *
 * Email addresses must be **verified** to ensure that they are assigned to their rightful owners. The `EmailAddress` object holds all necessary state around the verification process.
 *
 * For implementation examples for adding and verifying email addresses, see the [email link custom flow](https://clerk.com/docs/custom-flows/email-links) and [email code custom flow](https://clerk.com/docs/custom-flows/add-email) guides.
 */
export interface EmailAddress {
  /** The unique identifier for the email address. */
  id: string;
  /** The value of the email address. */
  emailAddress: string;
  /** An object holding information on the verification of the email address. */
  verification: Verification | null;
  /** An array of objects containing information about any identifications that might be linked to the email address. */
  linkedTo: IdentificationLink[];
}

/**
 * The Backend `PhoneNumber` object describes a phone number. Phone numbers can be used as a proof of identification for users, or simply as a means of contacting users.
 *
 * Phone numbers must be **verified** to ensure that they can be assigned to their rightful owners. The `PhoneNumber` object holds all the necessary state around the verification process.
 *
 * Finally, phone numbers can be used as part of [multi-factor authentication](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options#multi-factor-authentication). During sign in, users can opt in to an extra verification step where they will receive an SMS message with a one-time code. This code must be entered to complete the sign in process.
 */
export interface PhoneNumber {
  /** The unique identifier for this phone number. */
  id: string;
  /** The value of this phone number, in [E.164 format](https://en.wikipedia.org/wiki/E.164). */
  phoneNumber: string;
  /** Set to `true` if this phone number is reserved for multi-factor authentication (2FA). Set to `false` otherwise. */
  reservedForSecondFactor: boolean;
  /** Set to `true` if this phone number is the default second factor. Set to `false` otherwise. A user must have exactly one default second factor, if multi-factor authentication (2FA) is enabled. */
  defaultSecondFactor: boolean;
  /** An object holding information on the verification of this phone number. */
  verification: Verification | null;
  /** An object containing information about any other identification that might be linked to this phone number. */
  linkedTo: IdentificationLink[];
}

/**
 * The Backend `Web3Wallet` object describes a Web3 wallet address. The address can be used as a proof of identification for users.
 *
 * Web3 addresses must be verified to ensure that they can be assigned to their rightful owners. The verification is completed via Web3 wallet browser extensions, such as [Metamask](https://metamask.io/), [Coinbase Wallet](https://www.coinbase.com/wallet), and [OKX Wallet](https://www.okx.com/help/section/faq-web3-wallet). The `Web3Wallet3` object holds all the necessary state around the verification process.
 */
export interface Web3Wallet {
  /** The unique ID for the Web3 wallet. */
  id: string;
  /** The Web3 wallet address, made up of 0x + 40 hexadecimal characters. */
  web3Wallet: string;
  /** An object holding information on the verification of this Web3 wallet. */
  verification: Verification | null;
}

/** Construct a type with a set of properties K of type T */
export type RecordStringUnknown = Record<string, any>;

/**
 * The Backend `ExternalAccount` object is a model around an identification obtained by an external provider (e.g. a social provider such as Google).
 *
 * External account must be verified, so that you can make sure they can be assigned to their rightful owners. The `ExternalAccount` object holds all necessary state around the verification process.
 */
export interface ExternalAccount {
  /** The unique identifier for this external account. */
  id: string;
  /** The provider name (e.g., `google`). */
  provider: string;
  /** The identification with which this external account is associated. */
  identificationId: string;
  /** The unique ID of the user in the provider. */
  externalId: string;
  /** The scopes that the user has granted access to. */
  approvedScopes: string;
  /** The user's email address. */
  emailAddress: string;
  /** The user's first name. */
  firstName: string;
  /** The user's last name. */
  lastName: string;
  /** The user's image URL. */
  imageUrl: string;
  /** The user's username. */
  username: string | null;
  /** The phone number related to this specific external account. */
  phoneNumber: string | null;
  /** Metadata that can be read from the Frontend API and Backend API and can be set only from the Backend API. */
  publicMetadata: RecordStringUnknown | null;
  /** A descriptive label to differentiate multiple external accounts of the same user for the same provider. */
  label: string | null;
  /** An object holding information on the verification of this external account. */
  verification: Verification | null;
}

export interface SamlAccountConnection {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  provider: string;
  syncUserAttributes: boolean;
  allowSubdomains: boolean;
  allowIdpInitiated: boolean;
  /** @format double */
  createdAt: number;
  /** @format double */
  updatedAt: number;
}

/** The Backend `SamlAccount` object describes a SAML account. */
export interface SamlAccount {
  /** The unique identifier for the SAML account. */
  id: string;
  /** The provider of the SAML account. */
  provider: string;
  /** The user's ID as used in the provider. */
  providerUserId: string | null;
  /** A boolean that indicates whether the SAML account is active. */
  active: boolean;
  /** The email address of the SAML account. */
  emailAddress: string;
  /** The first name of the SAML account. */
  firstName: string;
  /** The last name of the SAML account. */
  lastName: string;
  /** The verification of the SAML account. */
  verification: Verification | null;
  /** The SAML connection of the SAML account. */
  samlConnection: SamlAccountConnection | null;
}

/** The Backend `User` object is similar to the `User` object as it holds information about a user of your application, such as their unique identifier, name, email addresses, phone numbers, and more. However, the Backend `User` object is different from the `User` object in that it is used in the [Backend API](https://clerk.com/docs/reference/backend-api/tag/Users#operation/GetUser){{ target: '_blank' }} and is not directly accessible from the Frontend API. */
export interface User {
  /** The unique identifier for the user. */
  id: string;
  /** A boolean indicating whether the user has a password on their account. */
  passwordEnabled: boolean;
  /** A boolean indicating whether the user has enabled TOTP by generating a TOTP secret and verifying it via an authenticator app. */
  totpEnabled: boolean;
  /** A boolean indicating whether the user has enabled Backup codes. */
  backupCodeEnabled: boolean;
  /** A boolean indicating whether the user has enabled two-factor authentication. */
  twoFactorEnabled: boolean;
  /** A boolean indicating whether the user is banned or not. */
  banned: boolean;
  /** A boolean indicating whether the user is banned or not. */
  locked: boolean;
  /**
   * The date when the user was first created.
   * @format double
   */
  createdAt: number;
  /**
   * The date when the user was last updated.
   * @format double
   */
  updatedAt: number;
  /** The URL of the user's profile image. */
  imageUrl: string;
  /** A getter boolean to check if the user has uploaded an image or one was copied from OAuth. Returns `false` if Clerk is displaying an avatar for the user. */
  hasImage: boolean;
  /** The ID for the `EmailAddress` that the user has set as primary. */
  primaryEmailAddressId: string | null;
  /** The ID for the `PhoneNumber` that the user has set as primary. */
  primaryPhoneNumberId: string | null;
  /** The ID for the [`Web3Wallet`](https://clerk.com/docs/references/backend/types/backend-web3-wallet) that the user signed up with. */
  primaryWeb3WalletId: string | null;
  /**
   * The date when the user last signed in. May be empty if the user has never signed in.
   * @format double
   */
  lastSignInAt: number | null;
  /** The ID of the user as used in your external systems. Must be unique across your instance. */
  externalId: string | null;
  /** The user's username. */
  username: string | null;
  /** The user's first name. */
  firstName: string | null;
  /** The user's last name. */
  lastName: string | null;
  /** Metadata that can be read from the Frontend API and [Backend API](https://clerk.com/docs/reference/backend-api){{ target: '_blank' }} and can be set only from the Backend API. */
  publicMetadata: UserPublicMetadata;
  /** Metadata that can be read and set only from the [Backend API](https://clerk.com/docs/reference/backend-api){{ target: '_blank' }}. */
  privateMetadata: UserPrivateMetadata;
  /** Metadata that can be read and set from the Frontend API. It's considered unsafe because it can be modified from the frontend. */
  unsafeMetadata: UserUnsafeMetadata;
  /** An array of all the `EmailAddress` objects associated with the user. Includes the primary. */
  emailAddresses: EmailAddress[];
  /** An array of all the `PhoneNumber` objects associated with the user. Includes the primary. */
  phoneNumbers: PhoneNumber[];
  /** An array of all the `Web3Wallet` objects associated with the user. Includes the primary. */
  web3Wallets: Web3Wallet[];
  /** An array of all the `ExternalAccount` objects associated with the user via OAuth. **Note**: This includes both verified & unverified external accounts. */
  externalAccounts: ExternalAccount[];
  /** An array of all the `SamlAccount` objects associated with the user via SAML. */
  samlAccounts: SamlAccount[];
  /**
   * Date when the user was last active.
   * @format double
   */
  lastActiveAt: number | null;
  /** A boolean indicating whether the organization creation is enabled for the user or not. */
  createOrganizationEnabled: boolean;
  /**
   * An integer indicating the number of organizations that can be created by the user. If the value is `0`, then the user can create unlimited organizations. Default is `null`.
   * @format double
   */
  createOrganizationsLimit: number | null;
  /** A boolean indicating whether the user can delete their own account. */
  deleteSelfEnabled: boolean;
  /**
   * The unix timestamp of when the user accepted the legal requirements. `null` if [**Require express consent to legal documents**](https://clerk.com/docs/authentication/configuration/legal-compliance) is not enabled.
   * @format double
   */
  legalAcceptedAt: number | null;
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
     * No description
     *
     * @tags Events
     * @name GetProtected
     * @request GET:/events/protected
     */
    getProtected: (params: RequestParams = {}) =>
      this.request<User, any>({
        path: `/events/protected`,
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
}
