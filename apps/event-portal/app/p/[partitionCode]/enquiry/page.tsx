import { Card, Stack } from '@event-portal/ui';
import { EnquiryForm } from '../../../../components/enquiry-form';
import { ErpShell } from '../../../../components/erp-shell';
import { getErpLanguageFromSearchParams, type ErpLanguage } from '../../../../lib/erp-language';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { partitionCode } = await params;
  const language = getErpLanguageFromSearchParams(await searchParams);
  const copy = getPageCopy(language);

  return (
    <ErpShell
      title={copy.title}
      subtitle={copy.subtitle}
      partitionCode={partitionCode}
      language={language}
    >
      <Stack>
        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <EnquiryForm language={language} />
        </Card>
      </Stack>
    </ErpShell>
  );
}

function getPageCopy(language: ErpLanguage) {
  if (language === 'zh-Hant') {
    return {
      title: '預約查詢 / 取消',
      subtitle: '參加者可透過已登記電郵或手機號碼索取預約資料，並使用安全連結取消預約。',
      cardTitle: '接收預約資料',
      cardDescription: '請輸入已登記的工作電郵或已登記手機號碼其中一項，請勿同時輸入兩者。',
    };
  }

  return {
    title: 'Appointment enquiry / cancellation',
    subtitle: 'Participants can request their booking details by registered email or mobile number and cancel through a secure link.',
    cardTitle: 'Receive booking information',
    cardDescription: 'Enter either your registered work email or your registered mobile number. Do not enter both.',
  };
}
