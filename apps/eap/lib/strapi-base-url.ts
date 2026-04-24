export function getStrapiBaseUrl() {
  const baseUrl = process.env.STRAPI_API_BASE_URL ?? process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}
