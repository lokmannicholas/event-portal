import { EmptyState } from '@event-portal/ui';
import type { EventAccessType } from '@event-portal/contracts';
import { EformSubmissionForm } from './eform-submission-form';
import { ErpShell } from './erp-shell';
import { getErpEformDetail } from '../lib/erp-api';
import {
  getLocalizedCompanyName,
  getLocalizedEformDescription,
  getLocalizedEformName,
  getLocalizedEformNotes,
  getLocalizedLocation,
  type ErpLanguage,
} from '../lib/erp-language';

export async function ErpEformPage(props: {
  eformIdentifier: string;
  language: ErpLanguage;
  fallbackPartitionCode?: string;
  expectedAccessType?: EventAccessType;
}) {
  const detail = await getErpEformDetail(props.eformIdentifier);
  const accessMismatch = Boolean(detail && props.expectedAccessType && detail.eform.accessType !== props.expectedAccessType);
  const partitionCode = detail?.eform.partitionCode || props.fallbackPartitionCode;
  const copy = getPageCopy(props.language);

  if (!detail || accessMismatch) {
    return (
      <ErpShell title={copy.notFoundShellTitle} subtitle={copy.notFoundSubtitle} partitionCode={partitionCode} language={props.language}>
        <EmptyState title={copy.notFoundTitle} description={copy.notFoundDescription} />
      </ErpShell>
    );
  }

  const eformName = getLocalizedEformName(detail.eform, props.language);
  const companyName = getLocalizedCompanyName(detail.eform, props.language);
  const location = getLocalizedLocation(detail.eform, props.language);
  const overviewText = getLocalizedEformNotes(detail.eform, props.language) || getLocalizedEformDescription(detail.eform, props.language) || copy.overviewFallback;

  return (
    <ErpShell title={copy.shellTitle} subtitle={eformName} partitionCode={detail.eform.partitionCode} headerCaption={companyName} language={props.language}>
      <div className="erp-event-booking-page">
        <section className="erp-event-overview-card">
          <div className="erp-event-overview-copy">
            <span className="erp-event-overview-kicker">{copy.overviewKicker}</span>
            <h2>{eformName}</h2>
            <p>{overviewText}</p>
          </div>

          <div className="erp-event-overview-stats">
            <div className="erp-event-overview-stat">
              <span>{copy.locationLabel}</span>
              <strong>{location}</strong>
            </div>
            <div className="erp-event-overview-stat">
              <span>{copy.eventWindowLabel}</span>
              <strong>
                {detail.eform.eventStartDate} - {detail.eform.eventEndDate}
              </strong>
            </div>
          </div>
        </section>

        <EformSubmissionForm detail={detail} language={props.language} />
      </div>
    </ErpShell>
  );
}

function getPageCopy(language: ErpLanguage) {
  if (language === 'zh-Hant') {
    return {
      notFoundShellTitle: '電子表格',
      notFoundSubtitle: '找不到所要求的電子表格。',
      notFoundTitle: '找不到電子表格',
      notFoundDescription: '請檢查電子表格連結及其公開／私人路徑，或聯絡 QHMS 支援。',
      shellTitle: '電子表格',
      overviewKicker: '電子表格',
      locationLabel: '地點',
      eventWindowLabel: '有效日期',
      overviewFallback: '請填寫所需資料並提交表格。',
    };
  }

  return {
    notFoundShellTitle: 'E-form detail',
    notFoundSubtitle: 'The requested e-form could not be found.',
    notFoundTitle: 'E-form not found',
    notFoundDescription: 'Check the e-form link and its public/private path, or contact QHMS support for assistance.',
    shellTitle: 'E-Form',
    overviewKicker: 'E-Form',
    locationLabel: 'Location',
    eventWindowLabel: 'Active window',
    overviewFallback: 'Complete the required fields and submit the form.',
  };
}
