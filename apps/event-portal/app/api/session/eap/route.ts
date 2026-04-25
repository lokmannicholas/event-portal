import { NextResponse } from 'next/server';
import { buildEapSession, setEapSessionCookie } from '../../../../lib/eap-auth';
import { canAccessAdminPortal, fetchPortalAuthUser } from '../../../../lib/portal-auth';
import { getStrapiBaseUrl } from '../../../../lib/strapi-base-url';

type RequestBody = {
  jwt?: string;
  documentId?: string;
  id?: number;
  username?: string;
  email?: string;
};

type StrapiMeResponse = {
  id?: number;
  documentId?: string;
  username?: string;
  email?: string;
};

function identifiersMatch(payload: RequestBody, me: StrapiMeResponse) {
  if (payload.documentId && me.documentId) {
    return payload.documentId === me.documentId;
  }

  if (typeof payload.id === 'number' && typeof me.id === 'number') {
    return payload.id === me.id;
  }

  if (payload.username && me.username) {
    return payload.username === me.username;
  }

  if (payload.email && me.email) {
    return payload.email === me.email;
  }

  return false;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as RequestBody | null;

  if (!payload?.jwt) {
    return NextResponse.json({ reason: 'missing-token' }, { status: 400 });
  }

  const meResponse = await fetch(`${getStrapiBaseUrl()}/api/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${payload.jwt}`,
    },
    cache: 'no-store',
    next: {
      revalidate: false,
    },
  });

  if (!meResponse.ok) {
    return NextResponse.json({ reason: 'invalid-token' }, { status: 401 });
  }

  const me = (await meResponse.json()) as StrapiMeResponse;

  if (!identifiersMatch(payload, me)) {
    return NextResponse.json({ reason: 'identity-mismatch' }, { status: 401 });
  }

  const documentId = me.documentId ?? payload.documentId;

  if (!documentId) {
    return NextResponse.json({ reason: 'missing-document-id' }, { status: 400 });
  }

  const user = await fetchPortalAuthUser(documentId, payload.jwt);

  if (!canAccessAdminPortal(user)) {
    return NextResponse.json({ reason: 'access-denied' }, { status: 403 });
  }

  await setEapSessionCookie(buildEapSession(user, payload.jwt));

  return NextResponse.json({ ok: true });
}
