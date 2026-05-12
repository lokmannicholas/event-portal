import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { duplicateEventAction } from '../actions/eap-record-actions';
import { EapShell } from '../../components/eap-shell';
import { getEvents } from '../../lib/api';
import { getPortalText } from '../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../lib/portal-language.server';
import { paginateItems } from '../../lib/pagination';

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 3h9a2 2 0 0 1 2 2v11h-2V5H9V3Zm-3 4h9a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h9V9H6Z"
        fill="currentColor"
      />
    </svg>
  );
}

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const language = await getPortalLanguageFromCookies();
  const data = await getEvents();
  const pagination = paginateItems(data, query);
  const copy = {
    title: getPortalText(language, 'Event Registration Master', '活動登記主檔'),
    subtitle: getPortalText(language, 'Editable generated events, registration windows, public availability rules, event lifecycle status, and event-code based ERP links.', '可編輯的已產生活動、登記時段、公開可見規則、活動生命週期狀態及基於活動代碼的 ERP 連結。'),
    createEvent: getPortalText(language, 'Create event', '建立活動'),
    cardTitle: getPortalText(language, 'Generated events', '已產生活動'),
    cardDescription: getPortalText(language, 'This screen maps to the editable registration form. Dates and timeslots can be enabled or disabled after generation. Open a record to update it.', '此畫面對應可編輯的登記表單。產生後仍可啟用或停用日期及時段。開啟記錄以更新。'),
    event: getPortalText(language, 'Event', '活動'),
    eventCode: getPortalText(language, 'Event Code', '活動代碼'),
    partition: getPortalText(language, 'Partition', '分區'),
    eventWindow: getPortalText(language, 'Event Window', '活動日期'),
    registrationWindow: getPortalText(language, 'Registration Window', '登記時段'),
    status: getPortalText(language, 'Status', '狀態'),
    publicUrl: getPortalText(language, 'Public URL', '公開網址'),
    detail: getPortalText(language, 'Detail', '詳情'),
    copyLabel: getPortalText(language, 'Copy', '複製'),
    openRecord: getPortalText(language, 'Open record', '開啟記錄'),
    duplicateEvent: (eventName: string) => getPortalText(language, `Duplicate ${eventName}`, `複製 ${eventName}`),
    duplicateTitle: getPortalText(language, 'Duplicate event', '複製活動'),
    itemLabel: getPortalText(language, 'events', '活動'),
  };

  return (
    <EapShell
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/events/new" label={copy.createEvent} />
        </ActionRow>

        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'event', label: copy.event },
              { key: 'eventCode', label: copy.eventCode },
              { key: 'partition', label: copy.partition },
              { key: 'eventWindow', label: copy.eventWindow },
              { key: 'registrationWindow', label: copy.registrationWindow },
              { key: 'status', label: copy.status },
              { key: 'publicUrl', label: copy.publicUrl },
              { key: 'detail', label: copy.detail },
              { key: 'copy', label: copy.copyLabel },
            ]}
            rows={pagination.items.map((event) => ({
              event: (
                <div>
                  <div style={{ fontWeight: 700 }}>
                    <a href={`/events/${event.documentId}`}>{event.eventName}</a>
                  </div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>{event.companyName} · {event.location}</div>
                </div>
              ),
              eventCode: event.eventCode,
              partition: event.partitionCode,
              eventWindow: `${event.eventStartDate} → ${event.eventEndDate}`,
              registrationWindow: `${event.registrationStartDate} → ${event.registrationEndDate}`,
              status: <StatusBadge value={event.status} />,
              publicUrl: <a href={event.publicUrl}>{event.publicUrl}</a>,
              detail: <a href={`/events/${event.documentId}`}>{copy.openRecord}</a>,
              copy: (
                <form action={duplicateEventAction.bind(null, event.documentId)}>
                  <button
                    type="submit"
                    className="btn btn-outline-secondary"
                    aria-label={copy.duplicateEvent(event.eventName)}
                    title={copy.duplicateTitle}
                    style={{ padding: '0.45rem 0.55rem', lineHeight: 0 }}
                  >
                    <CopyIcon />
                  </button>
                </form>
              ),
            }))}
          />
          <PaginationControls basePath="/events" searchParams={query} pagination={pagination} itemLabel={copy.itemLabel} language={language} />
        </Card>
      </Stack>
    </EapShell>
  );
}
