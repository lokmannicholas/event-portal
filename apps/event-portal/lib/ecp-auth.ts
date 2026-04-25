import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  canAccessClientPortal,
  fetchPortalAuthUser,
  type PortalAuthUser,
} from './portal-auth';
import { decodeSignedSession, encodeSignedSession } from './signed-session';

export const ECP_SESSION_COOKIE = 'ecp_session';

export type EcpSession = {
  documentId: string;
  username: string;
  email: string;
  groupCode: string;
  portalRole: string;
  strapiJwt: string;
};

export function buildEcpSession(user: PortalAuthUser, strapiJwt: string, groupCode: string): EcpSession {
  return {
    documentId: user.documentId,
    username: user.username,
    email: user.email,
    groupCode,
    portalRole: user.portalRole,
    strapiJwt,
  };
}

export async function getRawEcpSession(): Promise<EcpSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ECP_SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  return decodeSignedSession<EcpSession>(raw);
}

export async function getEcpSession(groupCode?: string): Promise<EcpSession | null> {
  const session = await getRawEcpSession();

  if (!session) {
    return null;
  }

  const user = await fetchPortalAuthUser(session.documentId, session.strapiJwt);
  const activeGroupCode = groupCode ?? session.groupCode;

  if (!activeGroupCode || !canAccessClientPortal(user, activeGroupCode)) {
    return null;
  }

  return buildEcpSession(user, session.strapiJwt, activeGroupCode);
}

export async function requireEcpSession(groupCode: string): Promise<EcpSession> {
  const session = await getEcpSession(groupCode);

  if (!session) {
    redirect(`/ecp/${groupCode}/login?reason=auth-required`);
  }

  return session;
}

export async function setEcpSessionCookie(session: EcpSession) {
  const cookieStore = await cookies();
  cookieStore.set(ECP_SESSION_COOKIE, encodeSignedSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearEcpSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ECP_SESSION_COOKIE);
}
