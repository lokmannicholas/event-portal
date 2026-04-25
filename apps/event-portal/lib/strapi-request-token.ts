import { cookies } from 'next/headers';
import { decodeSignedSession } from './signed-session';

type SessionWithJwt = {
  strapiJwt?: string;
};

const EAP_SESSION_COOKIE = 'eap_session';
const ECP_SESSION_COOKIE = 'ecp_session';

function getEnvToken() {
  const writeToken = process.env.STRAPI_API_TOKEN?.trim();

  if (writeToken) {
    return writeToken;
  }

  const readToken = process.env.STRAPI_READ_TOKEN?.trim();

  if (readToken) {
    return readToken;
  }

  return undefined;
}

export async function getServerStrapiRequestToken(optional = false) {
  const cookieStore = await cookies();
  const eapSession = cookieStore.get(EAP_SESSION_COOKIE)?.value;
  const ecpSession = cookieStore.get(ECP_SESSION_COOKIE)?.value;

  for (const raw of [eapSession, ecpSession]) {
    if (!raw) {
      continue;
    }

    const session = decodeSignedSession<SessionWithJwt>(raw);

    if (session?.strapiJwt) {
      return session.strapiJwt;
    }
  }

  const envToken = getEnvToken();

  if (envToken) {
    return envToken;
  }

  if (optional) {
    return undefined;
  }

  throw new Error('Missing Strapi bearer token for authenticated request.');
}
