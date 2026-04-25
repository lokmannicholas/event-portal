import { eventPortalSdk } from './event-portal-sdk';
import { decodeSignedSession, encodeSignedSession } from './signed-session';
import { getStrapiBaseUrl } from './strapi-base-url';
import type { EventPortalUserGroupEntity, StrapiAuthResponse, StrapiManyRelation, StrapiRelation } from './event-portal-types';

export type PortalAuthUser = {
  documentId: string;
  username: string;
  email: string;
  portalRole: 'ADMIN' | 'CLIENT_HR';
  status: 'ACTIVE' | 'DISABLED';
  userGroupCodes: string[];
  userGroupDocumentIds: string[];
};

export type PortalCredentialAuthResult = {
  jwt: string;
  user: PortalAuthUser;
};

function isExpandedUserGroupRelation(
  relation: StrapiRelation<EventPortalUserGroupEntity>,
): relation is EventPortalUserGroupEntity {
  return 'code' in relation;
}

function getLinkedUserGroups(value: StrapiManyRelation<EventPortalUserGroupEntity> | undefined) {
  return Array.isArray(value) ? value.filter(isExpandedUserGroupRelation) : [];
}

function mapPortalAuthUser(user: {
  documentId: string;
  username?: string;
  email: string;
  portalRole?: 'ADMIN' | 'CLIENT_HR';
  blocked?: boolean;
  userGroups?: StrapiManyRelation<EventPortalUserGroupEntity>;
}): PortalAuthUser {
  const portalRole = user.portalRole ?? 'CLIENT_HR';
  const userGroups = portalRole === 'CLIENT_HR' ? getLinkedUserGroups(user.userGroups) : [];

  return {
    documentId: user.documentId,
    username: user.username ?? user.email,
    email: user.email,
    portalRole,
    status: user.blocked ? 'DISABLED' : 'ACTIVE',
    userGroupCodes: userGroups.map((group) => group.code).filter(Boolean),
    userGroupDocumentIds: userGroups.map((group) => group.documentId).filter(Boolean),
  };
}

export async function fetchPortalAuthUser(documentId: string, token?: string): Promise<PortalAuthUser | null> {
  const loadUser = async (requestToken?: string) => {
    const response = await eventPortalSdk.users.findOne(
      documentId,
      {
        populate: ['userGroups'],
      },
      {
        cache: 'no-store',
        revalidate: false,
        token: requestToken,
      },
    );

    return mapPortalAuthUser(response.data);
  };

  try {
    return await loadUser(token);
  } catch {
    try {
      return await loadUser(undefined);
    } catch {
      return null;
    }
  }
}

export async function authenticatePortalCredentials(identifier: string, password: string): Promise<PortalCredentialAuthResult | null> {
  try {
    const response = await fetch(`${getStrapiBaseUrl()}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
      cache: 'no-store',
      next: {
        revalidate: false,
      },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return null;
    }

    const authResponse = (await response.json()) as StrapiAuthResponse;

    const documentId = authResponse.user.documentId;

    if (!documentId) {
      return null;
    }

    const user = await fetchPortalAuthUser(documentId, authResponse.jwt);

    if (!user) {
      return null;
    }

    return {
      jwt: authResponse.jwt,
      user,
    };
  } catch {
    return null;
  }
}

export function canAccessAdminPortal(user: PortalAuthUser | null | undefined): user is PortalAuthUser & { portalRole: 'ADMIN' } {
  return Boolean(user && user.status === 'ACTIVE' && user.portalRole === 'ADMIN');
}

export function canAccessClientPortal(
  user: PortalAuthUser | null | undefined,
  groupCode?: string,
): user is PortalAuthUser & { portalRole: 'CLIENT_HR' } {
  return Boolean(
    user &&
    user.status === 'ACTIVE' &&
    user.portalRole === 'CLIENT_HR' &&
    user.userGroupCodes.length > 0 &&
    (!groupCode || user.userGroupCodes.includes(groupCode)),
  );
}
