import { Card, EmptyState, SimpleTable, SplitGrid, Stack, StatGrid, StatusBadge } from '@event-portal/ui';
import { EcpShell } from '../../../components/ecp-shell';
import { getEcpDashboard, getEcpEvents } from '../../../lib/ecp-api';
import { getPortalText } from '../../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../../lib/portal-language.server';

type PageProps = {
  params: Promise<{ groupCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { groupCode } = await params;
  const language = await getPortalLanguageFromCookies();
  const [dashboard, events] = await Promise.all([
    getEcpDashboard(groupCode),
    getEcpEvents(groupCode),
  ]);
  const stats = dashboard.stats.map((item) => ({
    ...item,
    label: getPortalText(
      language,
      item.label,
      item.label === 'Visible events' ? '可見活動' : item.label === 'Confirmed bookings' ? '已確認預約' : item.label === 'Documents' ? '文件' : item.label,
    ),
    helper: item.helper
      ? getPortalText(
          language,
          item.helper,
          item.helper === 'Across visible events' ? '可見活動總計' : item.helper === 'Portal downloads' ? '入口下載' : item.helper,
        )
      : item.helper,
  }));
  const copy = {
    title: getPortalText(language, 'Dashboard', '主頁'),
    subtitle: getPortalText(language, `HR-facing portal for group ${groupCode}.`, `${groupCode} 的 HR 入口。`),
    emptyTitle: getPortalText(language, 'No visible events', '沒有可見活動'),
    emptyDescription: getPortalText(language, 'This group does not currently have any visible event in its linked partitions.', '此群組在其連結分區中目前沒有任何可見活動。'),
    visibleEvents: getPortalText(language, 'Visible events', '可見活動'),
    visibleEventsDescription: getPortalText(language, 'Client HR users only see events within the partitions linked to their group.', '客戶 HR 用戶只會看到連結至其群組分區內的活動。'),
    event: getPortalText(language, 'Event', '活動'),
    window: getPortalText(language, 'Registration Window', '登記時段'),
    status: getPortalText(language, 'Status', '狀態'),
    visit: getPortalText(language, 'ERP Link', 'ERP 連結'),
    visitErp: getPortalText(language, 'Visit ERP', '前往 ERP'),
    scopeTitle: getPortalText(language, 'What this client portal covers', '此客戶入口涵蓋內容'),
    scopeDescription: getPortalText(language, 'The detailed management actions stay in EAP, while ECP focuses on visibility, cancellation, exports, and participant monitoring.', '詳細管理操作保留於 EAP，而 ECP 專注於活動可見性、取消、匯出及參加者監察。'),
  };

  return (
    <EcpShell
      title={copy.title}
      subtitle={copy.subtitle}
      groupCode={groupCode}
    >
      <Stack>
        <StatGrid items={stats} />

        {events.length === 0 ? (
          <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
        ) : (
          <SplitGrid
            left={
              <Card title={copy.visibleEvents} description={copy.visibleEventsDescription}>
                <SimpleTable
                  columns={[
                    { key: 'event', label: copy.event },
                    { key: 'window', label: copy.window },
                    { key: 'status', label: copy.status },
                    { key: 'visit', label: copy.visit },
                  ]}
                  rows={events.map((event) => ({
                    event: (
                      <div>
                        <div style={{ fontWeight: 700 }}>{event.eventName}</div>
                        <div style={{ color: '#5b677a', fontSize: '13px' }}>{event.location}</div>
                      </div>
                    ),
                    window: `${event.registrationStartDate} → ${event.registrationEndDate}`,
                    status: <StatusBadge value={event.status} />,
                    visit: <a href={event.publicUrl}>{copy.visitErp}</a>,
                  }))}
                />
              </Card>
            }
            right={
              <Card title={copy.scopeTitle} description={copy.scopeDescription}>
                <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                  <li>{getPortalText(language, 'View appointments by event', '按活動查看預約')}</li>
                  <li>{getPortalText(language, 'Open the ERP event registration page', '開啟 ERP 活動登記頁面')}</li>
                  <li>{getPortalText(language, 'Download QR / URL payload details', '下載二維碼 / URL 內容')}</li>
                  <li>{getPortalText(language, 'Cancel appointments with record retention', '取消預約並保留記錄')}</li>
                </ul>
              </Card>
            }
          />
        )}
      </Stack>
    </EcpShell>
  );
}
