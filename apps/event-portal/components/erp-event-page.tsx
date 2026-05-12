import { EmptyState } from '@event-portal/ui';
import type { EventAccessType } from '@event-portal/contracts';
import { BookingForm } from './booking-form';
import { ErpShell } from './erp-shell';
import { getErpEventDetail } from '../lib/erp-api';
import {
  getLocalizedCompanyName,
  getLocalizedDescription,
  getLocalizedEventName,
  getLocalizedLocation,
  getLocalizedNotes,
  type ErpLanguage,
} from '../lib/erp-language';

export async function ErpEventPage(props: {
  eventIdentifier: string;
  language: ErpLanguage;
  fallbackPartitionCode?: string;
  expectedAccessType?: EventAccessType;
}) {
  const detail = await getErpEventDetail(props.eventIdentifier);
  const accessMismatch = Boolean(detail && props.expectedAccessType && detail.event.accessType !== props.expectedAccessType);
  const partitionCode = detail?.event.partitionCode || props.fallbackPartitionCode;
  const copy = getPageCopy(props.language);

  if (!detail || accessMismatch) {
    return (
      <ErpShell title={copy.notFoundShellTitle} subtitle={copy.notFoundSubtitle} partitionCode={partitionCode} language={props.language}>
        <EmptyState title={copy.notFoundTitle} description={copy.notFoundDescription} />
      </ErpShell>
    );
  }

  const eventName = getLocalizedEventName(detail.event, props.language);
  const companyName = getLocalizedCompanyName(detail.event, props.language);
  const location = getLocalizedLocation(detail.event, props.language);
  const overviewText = getLocalizedNotes(detail.event, props.language) || getLocalizedDescription(detail.event, props.language) || copy.overviewFallback;

  return (
    <ErpShell
      title={copy.shellTitle}
      subtitle={eventName}
      partitionCode={detail.event.partitionCode}
      headerCaption={companyName}
      language={props.language}
    >
      <div className="erp-event-booking-page">
        <section className="erp-event-overview-card">
          <div className="erp-event-overview-copy">
            <span className="erp-event-overview-kicker">{copy.overviewKicker}</span>
            <h2>{eventName}</h2>
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
                {detail.event.eventStartDate} - {detail.event.eventEndDate}
              </strong>
            </div>
            <div className="erp-event-overview-stat">
              <span>{copy.registrationWindowLabel}</span>
              <strong>
                {detail.event.registrationStartDate} - {detail.event.registrationEndDate}
              </strong>
            </div>
          </div>
        </section>

        <BookingForm detail={detail} language={props.language} />
      </div>
    </ErpShell>
  );
}

function getPageCopy(language: ErpLanguage) {
  if (language === 'zh-Hant') {
    return {
      notFoundShellTitle: '活動詳情',
      notFoundSubtitle: '找不到所要求的活動。',
      notFoundTitle: '找不到活動',
      notFoundDescription: '請檢查活動連結及其公開／私人路徑，或聯絡 QHMS 支援。',
      shellTitle: '預約服務',
      overviewKicker: '預約服務',
      locationLabel: '地點',
      eventWindowLabel: '活動日期',
      registrationWindowLabel: '登記日期',
      overviewFallback: '選擇可用時段，填寫所需參加者資料，即可完成預約。',
    };
  }

  return {
    notFoundShellTitle: 'Event detail',
    notFoundSubtitle: 'The requested event could not be found.',
    notFoundTitle: 'Event not found',
    notFoundDescription: 'Check the event link and its public/private path, or contact QHMS support for assistance.',
    shellTitle: 'Appointment Booking',
    overviewKicker: 'Appointment Booking',
    locationLabel: 'Location',
    eventWindowLabel: 'Event window',
    registrationWindowLabel: 'Registration window',
    overviewFallback: 'Choose the available session and complete the required participant details to secure your booking.',
  };
}
