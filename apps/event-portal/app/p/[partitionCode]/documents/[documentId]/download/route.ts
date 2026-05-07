import { getErpDocuments } from '../../../../../../lib/erp-api';
import { proxyDocumentDownload } from '../../../../../../lib/document-download';

type RouteContext = {
  params: Promise<{
    partitionCode: string;
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { documentId } = await context.params;
  const documents = await getErpDocuments();
  const document = documents.find((item) => item.documentId === documentId);

  if (!document?.downloadUrl) {
    return new Response('Document not found.', { status: 404 });
  }

  return proxyDocumentDownload(document.downloadUrl, document.fileName);
}
