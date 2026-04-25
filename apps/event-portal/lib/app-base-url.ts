import { headers } from 'next/headers';

function normalizeBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export async function getAppBaseUrl() {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  return 'http://localhost:3000';
}
