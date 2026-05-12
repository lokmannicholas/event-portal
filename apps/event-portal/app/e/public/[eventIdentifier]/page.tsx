import { ErpEventPage } from '../../../../components/erp-event-page';
import { getErpLanguageFromSearchParams } from '../../../../lib/erp-language';

type PageProps = {
  params: Promise<{ eventIdentifier: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { eventIdentifier } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);

  return <ErpEventPage eventIdentifier={eventIdentifier} language={language} expectedAccessType="PUBLIC" />;
}
