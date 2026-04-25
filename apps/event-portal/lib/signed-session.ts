import { createHmac, timingSafeEqual } from 'node:crypto';

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

function signPayload(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function encodeSignedSession<T>(session: T) {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function decodeSignedSession<T>(raw: string): T | null {
  const [payload, signature] = raw.split('.');

  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}
