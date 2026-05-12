import { ErpEformPage } from '../../../../components/erp-eform-page';
import { getErpLanguageFromSearchParams } from '../../../../lib/erp-language';

type PageProps = {
  params: Promise<{ eformIdentifier: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { eformIdentifier } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);

  return <ErpEformPage eformIdentifier={eformIdentifier} language={language} expectedAccessType="PUBLIC" />;
}
