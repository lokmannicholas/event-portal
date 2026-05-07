import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ForbiddenError, UnauthorizedError } = errors;

type PortalUserGroup = {
  code?: string | null;
  documentId?: string | null;
};

type PortalUser = {
  id: number | string;
  email?: string | null;
  blocked?: boolean | null;
  portalRole?: string | null;
  userGroups?: PortalUserGroup[] | null;
};

type PortalAuthContext = {
  request?: {
    body?: unknown;
    method?: string;
    query?: Record<string, unknown>;
  };
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  state: Record<string, unknown>;
};

function getUserId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  }

  return undefined;
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export async function authenticatePortalUser(strapi: Core.Strapi, ctx: PortalAuthContext) {
  const tokenPayload = await strapi.plugin('users-permissions').service('jwt').getToken(ctx);
  const userId = getUserId(tokenPayload?.id);

  if (userId === undefined) {
    throw new UnauthorizedError('Missing or invalid bearer token.');
  }

  const user = (await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: ['role', 'userGroups'],
  })) as PortalUser | null;

  if (!user || user.blocked) {
    throw new UnauthorizedError('Invalid credentials.');
  }

  ctx.state.user = user;
  ctx.state.portalUser = user;

  return user;
}

export function assertAdminAccess(user: PortalUser) {
  if (user.portalRole !== 'ADMIN') {
    throw new ForbiddenError('This API is restricted to portalRole ADMIN users.');
  }
}

export function getRequestGroupCode(ctx: PortalAuthContext) {
  const body = asRecord(ctx.request?.body);

  return (
    getString(body?.groupCode) ??
    getString(ctx.request?.query?.groupCode) ??
    getString(ctx.query?.groupCode) ??
    getString(ctx.params?.groupCode)
  );
}

export function assertClientGroupAccess(user: PortalUser, groupCode: string | undefined) {
  if (user.portalRole !== 'CLIENT_HR') {
    throw new ForbiddenError('This API is restricted to portalRole CLIENT_HR users.');
  }

  if (!groupCode) {
    throw new ForbiddenError('Missing groupCode for ECP access control.');
  }

  const userGroupCodes = Array.isArray(user.userGroups)
    ? user.userGroups.map((group) => getString(group?.code)).filter((code): code is string => Boolean(code))
    : [];

  if (!userGroupCodes.includes(groupCode)) {
    throw new ForbiddenError('You cannot access ECP data outside your assigned user groups.');
  }
}

export function assertDeleteBlocked(ctx: PortalAuthContext, message: string) {
  if (String(ctx.request?.method ?? '').toUpperCase() === 'DELETE') {
    throw new ForbiddenError(message);
  }
}
