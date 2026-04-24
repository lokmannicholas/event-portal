import { getStrapiBaseUrl } from './strapi-base-url';

export function toAbsoluteStrapiMediaUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${getStrapiBaseUrl()}${normalizedPath}`;
}
