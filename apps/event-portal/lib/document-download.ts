import { toAbsoluteStrapiMediaUrl } from './strapi-media';

function buildContentDisposition(fileName: string) {
  const safeFileName = (fileName || 'document')
    .replace(/[\r\n"]/g, '_')
    .trim();
  const fallbackFileName = safeFileName || 'document';

  return `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodeURIComponent(fallbackFileName)}`;
}

export async function proxyDocumentDownload(downloadUrl: string, fileName: string, bearerToken?: string) {
  const absoluteUrl = toAbsoluteStrapiMediaUrl(downloadUrl);

  if (!absoluteUrl) {
    return new Response('Document file is unavailable.', { status: 404 });
  }

  const upstream = await fetch(absoluteUrl, {
    headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined,
    cache: 'no-store',
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Document file is unavailable.', { status: upstream.status || 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('Content-Type') ?? 'application/octet-stream');
  headers.set('Content-Disposition', buildContentDisposition(fileName));

  const contentLength = upstream.headers.get('Content-Length');

  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
