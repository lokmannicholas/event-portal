import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PortalRole } from '@flu-vax/contracts';
import {
  canAccessAdminPortal,
  fetchPortalAuthUser,
  type PortalAuthUser,
} from './portal-auth';
import { decodeSignedSession, encodeSignedSession } from './signed-session';

export const EAP_SESSION_COOKIE = 'eap_session';

export type EapSession = {
  documentId: string;
  username: string;
  email: string;
  portalRole: PortalRole;
  strapiJwt: string;
};

export function buildEapSession(user: PortalAuthUser, strapiJwt: string): EapSession {
  return {
    documentId: user.documentId,
    username: user.username,
    email: user.email,
    portalRole: user.portalRole,
    strapiJwt,
  };
}

export async function getRawEapSession(): Promise<EapSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(EAP_SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  return decodeSignedSession<EapSession>(raw);
}

export async function getEapSession(): Promise<EapSession | null> {
  const session = await getRawEapSession();

  if (!session) {
    return null;
  }

  const user = await fetchPortalAuthUser(session.documentId, session.strapiJwt);

  if (!canAccessAdminPortal(user)) {
    return null;
  }

  return buildEapSession(user, session.strapiJwt);
}

export async function requireEapSession(): Promise<EapSession> {
  const session = await getEapSession();

  if (!session) {
    redirect('/login?reason=auth-required');
  }

  return session;
}

export async function setEapSessionCookie(session: EapSession) {
  const cookieStore = await cookies();
  cookieStore.set(EAP_SESSION_COOKIE, encodeSignedSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearEapSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(EAP_SESSION_COOKIE);
}
