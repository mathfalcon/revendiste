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

export interface PaginatedResponseIdStringNameStringCreatedAtDate {
  data: {
    /** @format date-time */
    createdAt: string;
    name: string;
    id: string;
  }[];
  pagination: PaginationMeta;
}

export interface InferTypeofPaginationSchema {
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  /** @format double */
  limit?: number;
  /** @format double */
  page?: number;
}

export type PaginationQuery = InferTypeofPaginationSchema;

export interface InferTypeofMyValidator {
  msg: string;
  /** @format double */
  code: number;
  result: {
    price: string;
  };
}

export type MyResponse = InferTypeofMyValidator;

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
  examples = {
    /**
     * No description
     *
     * @tags Example
     * @name GetAll
     * @request GET:/examples
     */
    getAll: (params: RequestParams = {}) =>
      this.request<
        {
          /** @format date-time */
          createdAt: string;
          name: string;
          id: string;
        }[],
        any
      >({
        path: `/examples`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Example
     * @name GetAllPaginated
     * @request POST:/examples/paginated
     */
    getAllPaginated: (
      data: PaginationQuery,
      query?: {
        sortOrder?: "asc" | "desc";
        sortBy?: string;
        /** @format double */
        limit?: number;
        /** @format double */
        page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedResponseIdStringNameStringCreatedAtDate, any>({
        path: `/examples/paginated`,
        method: "POST",
        query: query,
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Example
     * @name GetOne
     * @request GET:/examples/{id}
     */
    getOne: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @format date-time */
          createdAt: string;
          name: string;
          id: string;
        },
        any
      >({
        path: `/examples/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Example
     * @name GetTest
     * @request GET:/examples/test
     */
    getTest: (params: RequestParams = {}) =>
      this.request<MyResponse, any>({
        path: `/examples/test`,
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
