import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EAP_SESSION_COOKIE = 'eap_session';
const ECP_SESSION_COOKIE = 'ecp_session';

type EapSessionPayload = {
  portalRole?: string;
};

type EcpSessionPayload = {
  groupCode?: string;
  portalRole?: string;
};

function getSessionSecret() {
  const portalSessionSecret = process.env.PORTAL_SESSION_SECRET?.trim();

  if (portalSessionSecret) {
    return portalSessionSecret;
  }

  const strapiApiToken = process.env.STRAPI_API_TOKEN?.trim();

  if (strapiApiToken) {
    return strapiApiToken;
  }

  return 'local-dev-portal-session-secret';
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function verifySignedSession<T>(raw: string | undefined): Promise<T | null> {
  if (!raw) {
    return null;
  }

  const [payload, signature] = raw.split('.');

  if (!payload || !signature) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expectedBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = encodeBase64Url(new Uint8Array(expectedBytes));

  if (expected !== signature) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as T;
  } catch {
    return null;
  }
}

function redirectTo(request: NextRequest, target: string) {
  const url = request.nextUrl.clone();
  const [pathname, search = ''] = target.split('?');
  url.pathname = pathname;
  url.search = search ? `?${search}` : '';
  return NextResponse.redirect(url);
}

function isPublicPath(pathname: string) {
  if (pathname === '/login' || pathname === '/ecp' || pathname.startsWith('/p/')) {
    return true;
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] !== 'ecp' || segments.length < 3) {
    return false;
  }

  return segments[2] === 'login';
}

function getEcpGroupCode(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments[0] === 'ecp' && segments[1] ? segments[1] : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    const session = await verifySignedSession<EapSessionPayload>(request.cookies.get(EAP_SESSION_COOKIE)?.value);

    if (session?.portalRole === 'ADMIN') {
      return redirectTo(request, '/');
    }

    return NextResponse.next();
  }

  const ecpGroupCode = getEcpGroupCode(pathname);

  if (ecpGroupCode && pathname === `/ecp/${ecpGroupCode}/login`) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (ecpGroupCode) {
    const session = await verifySignedSession<EcpSessionPayload>(request.cookies.get(ECP_SESSION_COOKIE)?.value);

    if (session?.portalRole === 'CLIENT_HR' && session.groupCode === ecpGroupCode) {
      return NextResponse.next();
    }

    return redirectTo(request, `/ecp/${ecpGroupCode}/login?reason=auth-required`);
  }

  const session = await verifySignedSession<EapSessionPayload>(request.cookies.get(EAP_SESSION_COOKIE)?.value);

  if (session?.portalRole === 'ADMIN') {
    return NextResponse.next();
  }

  return redirectTo(request, '/login?reason=auth-required');
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
