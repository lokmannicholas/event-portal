import { ErpEventPage } from '../../../../../components/erp-event-page';
import { getErpLanguageFromSearchParams } from '../../../../../lib/erp-language';

type PageProps = {
  params: Promise<{ eventCode: string; partitionCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { eventCode, partitionCode } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);
  return <ErpEventPage eventIdentifier={eventCode} language={language} fallbackPartitionCode={partitionCode} />;
}
