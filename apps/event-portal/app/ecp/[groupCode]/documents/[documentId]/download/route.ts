import { NextResponse } from 'next/server';
import { getEcpSession } from '../../../../../../lib/ecp-auth';
import { getEcpDocuments } from '../../../../../../lib/ecp-api';
import { proxyDocumentDownload } from '../../../../../../lib/document-download';

type RouteContext = {
  params: Promise<{
    groupCode: string;
    documentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { groupCode, documentId } = await context.params;
  const session = await getEcpSession(groupCode);

  if (!session) {
    return NextResponse.redirect(new URL(`/ecp/${groupCode}/login?reason=auth-required`, request.url));
  }

  const documents = await getEcpDocuments(groupCode);
  const document = documents.find((item) => item.documentId === documentId);

  if (!document?.downloadUrl) {
    return new Response('Document not found.', { status: 404 });
  }

  return proxyDocumentDownload(document.downloadUrl, document.fileName, session.strapiJwt);
}
