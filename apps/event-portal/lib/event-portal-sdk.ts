import type {
  EventPortalAppointmentCreateInput,
  EventPortalAppointmentEntity,
  EventPortalAppointmentHoldCreateInput,
  EventPortalAppointmentHoldEntity,
  EventPortalAppointmentHoldUpdateInput,
  EventPortalAppointmentUpdateInput,
  EventPortalAuditLogCreateInput,
  EventPortalAuditLogEntity,
  EventPortalAuditLogUpdateInput,
  EventPortalContactInfoCreateInput,
  EventPortalContactInfoEntity,
  EventPortalContactInfoUpdateInput,
  EventPortalEventCreateInput,
  EventPortalEventEntity,
  EventPortalEventSlotCreateInput,
  EventPortalEventSlotEntity,
  EventPortalEventSlotUpdateInput,
  EventPortalEventTemplateCreateInput,
  EventPortalEventTemplateEntity,
  EventPortalEventTemplateUpdateInput,
  EventPortalEventUpdateInput,
  EventPortalMandatoryFieldCreateInput,
  EventPortalMandatoryFieldEntity,
  EventPortalMandatoryFieldUpdateInput,
  EventPortalNoticeCreateInput,
  EventPortalNoticeEntity,
  EventPortalNoticeTemplateCreateInput,
  EventPortalNoticeTemplateEntity,
  EventPortalNoticeTemplateUpdateInput,
  EventPortalNoticeUpdateInput,
  EventPortalPortalDocumentCreateInput,
  EventPortalPortalDocumentEntity,
  EventPortalPortalDocumentUpdateInput,
  StrapiAuthForgotPasswordInput,
  StrapiAuthLoginInput,
  StrapiAuthRegisterInput,
  StrapiAuthResetPasswordInput,
  StrapiAuthResponse,
  EventPortalUserGroupCreateInput,
  EventPortalUserGroupEntity,
  EventPortalUserGroupUpdateInput,
  EventPortalUserPartitionCreateInput,
  EventPortalUserPartitionEntity,
  EventPortalUserPartitionUpdateInput,
  UsersPermissionsUserCreateInput,
  UsersPermissionsUserEntity,
  UsersPermissionsUserUpdateInput,
} from './event-portal-types';
import { getServerStrapiRequestToken } from './strapi-request-token';
import { getStrapiBaseUrl } from './strapi-base-url';

type StrapiQueryPrimitive = string | number | boolean | null | undefined;
export type StrapiQueryValue =
  | StrapiQueryPrimitive
  | StrapiQueryValue[]
  | { [key: string]: StrapiQueryValue };

export type StrapiQueryParams = Record<string, StrapiQueryValue>;

export interface StrapiCollectionMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  [key: string]: unknown;
}

export interface StrapiCollectionResponse<TEntity> {
  data: TEntity[];
  meta: StrapiCollectionMeta;
}

export interface StrapiItemResponse<TEntity> {
  data: TEntity;
  meta: Record<string, unknown>;
}

export interface StrapiMutationBody<TData> {
  data: TData;
}

export interface StrapiSdkConfig {
  baseUrl?: string;
  apiPrefix?: string;
  token?: string;
  readToken?: string;
  revalidate?: number | false;
  fetchImpl?: typeof fetch;
}

export interface StrapiRequestOptions {
  query?: StrapiQueryParams;
  headers?: HeadersInit;
  token?: string;
  revalidate?: number | false;
  cache?: RequestCache;
}

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export class StrapiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'StrapiRequestError';
  }
}

export interface StrapiCollectionClient<TEntity, TCreateInput, TUpdateInput> {
  readonly path: string;
  findMany(query?: StrapiQueryParams, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiCollectionResponse<TEntity>>;
  findOne(documentId: string, query?: StrapiQueryParams, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  create(data: TCreateInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  replace(documentId: string, data: TCreateInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  update(documentId: string, data: TUpdateInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  delete(documentId: string, options?: Omit<StrapiRequestOptions, 'query'>): Promise<unknown>;
  get(query?: StrapiQueryParams, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiCollectionResponse<TEntity>>;
  post(data: TCreateInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  put(documentId: string, data: TCreateInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  patch(documentId: string, data: TUpdateInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiItemResponse<TEntity>>;
  remove(documentId: string, options?: Omit<StrapiRequestOptions, 'query'>): Promise<unknown>;
}

export interface StrapiAuthClient {
  login(input: StrapiAuthLoginInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiAuthResponse>;
  register(input: StrapiAuthRegisterInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<StrapiAuthResponse>;
  forgotPassword(input: StrapiAuthForgotPasswordInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<unknown>;
  resetPassword(input: StrapiAuthResetPasswordInput, options?: Omit<StrapiRequestOptions, 'query'>): Promise<unknown>;
}

export const eventPortalQueries = {
  partitionList(): StrapiQueryParams {
    return {
      populate: ['userGroup', 'template', 'logo', 'banners'],
      sort: ['code:asc'],
    };
  },
  partitionDetail(): StrapiQueryParams {
    return {
      populate: ['userGroup', 'template', 'logo', 'banners'],
    };
  },
  templateList(): StrapiQueryParams {
    return {
      populate: ['userPartitions', 'formFields'],
      sort: ['name:asc'],
    };
  },
  templateDetail(): StrapiQueryParams {
    return {
      populate: ['userPartitions', 'formFields'],
    };
  },
};

function appendQueryValue(params: URLSearchParams, key: string, value: StrapiQueryValue): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendQueryValue(params, `${key}[${index}]`, item));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendQueryValue(params, `${key}[${nestedKey}]`, nestedValue);
    });
    return;
  }

  params.append(key, String(value));
}

function buildQueryString(query?: StrapiQueryParams): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => appendQueryValue(params, key, value));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function createStrapiSdk(config: StrapiSdkConfig = {}) {
  const baseUrl = normalizeBaseUrl(config.baseUrl ?? getStrapiBaseUrl());
  const apiPrefix = config.apiPrefix ?? '/api';
  const configToken = config.token;
  const configReadToken = config.readToken;
  const revalidate = config.revalidate ?? 30;
  const fetchImpl = config.fetchImpl ?? fetch;

  function isAuthPath(path: string) {
    return path === '/auth/local' || path === '/api/auth/local';
  }

  function resolvePath(path: string): string {
    if (/^https?:\/\//.test(path)) {
      return path;
    }

    if (path.startsWith('/api/')) {
      return `${baseUrl}${path}`;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${apiPrefix}${normalizedPath}`;
  }

  async function parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  async function request<TResponse>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: StrapiRequestOptions = {},
    body?: unknown,
  ): Promise<TResponse> {
    const url = `${resolvePath(path)}${buildQueryString(options.query)}`;
    const token =
      options.token ??
      (method === 'GET' ? configReadToken : undefined) ??
      configToken ??
      (await getServerStrapiRequestToken(true));
    const headers = new Headers(options.headers);
    const needsAuthorization = !isAuthPath(path);

    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (needsAuthorization && !headers.has('Authorization') && !token) {
      throw new Error(`Missing Strapi bearer token for request to ${url}`);
    }

    if (needsAuthorization && token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const init: NextFetchOptions = {
      method,
      headers,
      cache: options.cache,
    };

    if (revalidate !== false || options.revalidate !== undefined) {
      init.next = { revalidate: options.revalidate ?? revalidate };
    }

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetchImpl(url, init);
    const parsed = await parseResponse(response);

    if (!response.ok) {
      throw new StrapiRequestError(
        `Strapi request failed with ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
        url,
        parsed,
      );
    }

    return parsed as TResponse;
  }

  function collection<TEntity, TCreateInput, TUpdateInput>(path: string): StrapiCollectionClient<TEntity, TCreateInput, TUpdateInput> {
    return {
      path,
      findMany(query, options) {
        return request<StrapiCollectionResponse<TEntity>>('GET', path, { ...options, query });
      },
      findOne(documentId, query, options) {
        return request<StrapiItemResponse<TEntity>>('GET', `${path}/${encodeURIComponent(documentId)}`, { ...options, query });
      },
      create(data, options) {
        return request<StrapiItemResponse<TEntity>>('POST', path, options, { data } satisfies StrapiMutationBody<TCreateInput>);
      },
      replace(documentId, data, options) {
        return request<StrapiItemResponse<TEntity>>(
          'PUT',
          `${path}/${encodeURIComponent(documentId)}`,
          options,
          { data } satisfies StrapiMutationBody<TCreateInput>,
        );
      },
      update(documentId, data, options) {
        console.log('[strapi] update', { documentId, data, options });
        return request<StrapiItemResponse<TEntity>>(
          'PUT',
          `${path}/${encodeURIComponent(documentId)}`,
          options,
          { data } satisfies StrapiMutationBody<TUpdateInput>,
        );
      },
      delete(documentId, options) {
        return request<unknown>('DELETE', `${path}/${encodeURIComponent(documentId)}`, options);
      },
      get(query, options) {
        return this.findMany(query, options);
      },
      post(data, options) {
        return this.create(data, options);
      },
      put(documentId, data, options) {
        return this.replace(documentId, data, options);
      },
      patch(documentId, data, options) {
        return this.update(documentId, data, options);
      },
      remove(documentId, options) {
        return this.delete(documentId, options);
      },
    };
  }

  return {
    request,
    get<TResponse>(path: string, options?: StrapiRequestOptions) {
      return request<TResponse>('GET', path, options);
    },
    post<TResponse, TBody>(path: string, data: TBody, options?: StrapiRequestOptions) {
      return request<TResponse>('POST', path, options, data);
    },
    put<TResponse, TBody>(path: string, data: TBody, options?: StrapiRequestOptions) {
      return request<TResponse>('PUT', path, options, data);
    },
    patch<TResponse, TBody>(path: string, data: TBody, options?: StrapiRequestOptions) {
      return request<TResponse>('PATCH', path, options, data);
    },
    collection,
  };
}

export function createEventPortalSdk(config?: StrapiSdkConfig) {
  const sdk = createStrapiSdk(config);
  const users: StrapiCollectionClient<UsersPermissionsUserEntity, UsersPermissionsUserCreateInput, UsersPermissionsUserUpdateInput> = {
    path: '/portal/management/users',
    findMany(query, options) {
      return sdk.get<StrapiCollectionResponse<UsersPermissionsUserEntity>>('/portal/management/users', { ...options, query });
    },
    findOne(documentId, query, options) {
      return sdk.get<StrapiItemResponse<UsersPermissionsUserEntity>>(`/portal/management/users/${encodeURIComponent(documentId)}`, {
        ...options,
        query,
      });
    },
    create(data, options) {
      return sdk.post<StrapiItemResponse<UsersPermissionsUserEntity>, UsersPermissionsUserCreateInput>(
        '/portal/management/users',
        data,
        options,
      );
    },
    replace(documentId, data, options) {
      return sdk.put<StrapiItemResponse<UsersPermissionsUserEntity>, UsersPermissionsUserCreateInput>(
        `/portal/management/users/${encodeURIComponent(documentId)}`,
        data,
        options,
      );
    },
    update(documentId, data, options) {
      return sdk.patch<StrapiItemResponse<UsersPermissionsUserEntity>, UsersPermissionsUserUpdateInput>(
        `/portal/management/users/${encodeURIComponent(documentId)}`,
        data,
        options,
      );
    },
    delete(documentId, options) {
      return sdk.request('DELETE', `/portal/management/users/${encodeURIComponent(documentId)}`, options);
    },
    get(query, options) {
      return this.findMany(query, options);
    },
    post(data, options) {
      return this.create(data, options);
    },
    put(documentId, data, options) {
      return this.replace(documentId, data, options);
    },
    patch(documentId, data, options) {
      return this.update(documentId, data, options);
    },
    remove(documentId, options) {
      return this.delete(documentId, options);
    },
  };

  const auth: StrapiAuthClient = {
    login(input, options) {
      return sdk.post<StrapiAuthResponse, StrapiAuthLoginInput>('/auth/local', input, { ...options, token: '' });
    },
    register(input, options) {
      return sdk.post<StrapiAuthResponse, StrapiAuthRegisterInput>('/auth/local/register', input, { ...options, token: '' });
    },
    forgotPassword(input, options) {
      return sdk.post<unknown, StrapiAuthForgotPasswordInput>('/auth/forgot-password', input, { ...options, token: '' });
    },
    resetPassword(input, options) {
      return sdk.post<unknown, StrapiAuthResetPasswordInput>('/auth/reset-password', input, { ...options, token: '' });
    },
  };

  return {
    raw: sdk,
    auth,
    appointmentHolds: sdk.collection<
      EventPortalAppointmentHoldEntity,
      EventPortalAppointmentHoldCreateInput,
      EventPortalAppointmentHoldUpdateInput
    >('/appointment-holds'),
    appointments: sdk.collection<EventPortalAppointmentEntity, EventPortalAppointmentCreateInput, EventPortalAppointmentUpdateInput>(
      '/appointments',
    ),
    auditLogs: sdk.collection<EventPortalAuditLogEntity, EventPortalAuditLogCreateInput, EventPortalAuditLogUpdateInput>('/audit-logs'),
    contactInfos: sdk.collection<
      EventPortalContactInfoEntity,
      EventPortalContactInfoCreateInput,
      EventPortalContactInfoUpdateInput
    >('/contact-infos'),
    eventSlots: sdk.collection<EventPortalEventSlotEntity, EventPortalEventSlotCreateInput, EventPortalEventSlotUpdateInput>('/event-slots'),
    noticeTemplates: sdk.collection<
      EventPortalNoticeTemplateEntity,
      EventPortalNoticeTemplateCreateInput,
      EventPortalNoticeTemplateUpdateInput
    >('/notice-templates'),
    notices: sdk.collection<EventPortalNoticeEntity, EventPortalNoticeCreateInput, EventPortalNoticeUpdateInput>('/notices'),
    eventTemplates: sdk.collection<
      EventPortalEventTemplateEntity,
      EventPortalEventTemplateCreateInput,
      EventPortalEventTemplateUpdateInput
    >('/event-templates'),
    events: sdk.collection<EventPortalEventEntity, EventPortalEventCreateInput, EventPortalEventUpdateInput>('/events'),
    mandatoryFields: sdk.collection<
      EventPortalMandatoryFieldEntity,
      EventPortalMandatoryFieldCreateInput,
      EventPortalMandatoryFieldUpdateInput
    >('/mandatory-fields'),
    portalDocuments: sdk.collection<
      EventPortalPortalDocumentEntity,
      EventPortalPortalDocumentCreateInput,
      EventPortalPortalDocumentUpdateInput
    >('/portal-documents'),
    users,
    userGroups: sdk.collection<EventPortalUserGroupEntity, EventPortalUserGroupCreateInput, EventPortalUserGroupUpdateInput>(
      '/user-groups',
    ),
    userPartitions: sdk.collection<
      EventPortalUserPartitionEntity,
      EventPortalUserPartitionCreateInput,
      EventPortalUserPartitionUpdateInput
    >('/user-partitions'),
  };
}

export const eventPortalSdk = createEventPortalSdk();

export type EventPortalSdk = ReturnType<typeof createEventPortalSdk>;

export * from './event-portal-types';
