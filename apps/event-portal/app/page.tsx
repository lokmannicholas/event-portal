import Link from 'next/link';
import { Card, SimpleTable, Stack, StatGrid, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../components/eap-shell';
import { getAppointments, getDashboard, getEvents } from '../lib/api';
import { getPortalText } from '../lib/portal-language';
import { getPortalLanguageFromCookies } from '../lib/portal-language.server';

export default async function Page() {
  const language = await getPortalLanguageFromCookies();
  const [dashboard, eventRows, appointmentRows] = await Promise.all([
    getDashboard(),
    getEvents(),
    getAppointments(),
  ]);
  const stats = dashboard.stats.map((item) => ({
    ...item,
    label: getPortalText(
      language,
      item.label,
      item.label === 'Partitions'
        ? '分區'
        : item.label === 'Templates'
          ? '模板'
          : item.label === 'Events'
            ? '活動'
            : item.label === 'Appointments'
              ? '預約'
              : item.label === 'Users'
                ? '用戶'
                : item.label,
    ),
    helper: item.helper
      ? getPortalText(
          language,
          item.helper,
          item.helper === 'Public ERP entry scopes'
            ? 'ERP 公開入口範圍'
            : item.helper === 'Reusable form blueprints'
              ? '可重用表單藍圖'
              : item.helper === 'Released and draft event records'
                ? '已發佈及草稿活動記錄'
                : item.helper === 'Cross-portal booking records'
                  ? '跨入口預約記錄'
                  : item.helper === 'Login-enabled users-permissions users'
                    ? '可登入的 users-permissions 用戶'
                    : item.helper,
        )
      : item.helper,
  }));
  const copy = {
    title: getPortalText(language, 'Dashboard', '主頁'),
    subtitle: getPortalText(language, 'Admin entry point for partitions, templates, event release, appointments, portal documents, and support content.', '管理分區、模板、活動發佈、預約、入口文件及支援內容的入口。'),
    ops: getPortalText(language, 'EAP Operations', 'EAP 營運'),
    heroTitle: getPortalText(language, 'Vaccination campaign control centre', '疫苗活動控制中心'),
    heroDescription: getPortalText(language, 'Prepare event templates, release registration windows, and monitor bookings across the admin, client, and public registration portals from one workspace.', '在同一工作區內準備活動模板、發佈登記時段，並監察管理端、客戶端與公開登記入口的預約情況。'),
    createEvent: getPortalText(language, 'Create event', '建立活動'),
    reviewBookings: getPortalText(language, 'Review bookings', '檢視預約'),
    manageTemplates: getPortalText(language, 'Manage templates', '管理模板'),
    liveOverview: getPortalText(language, 'Live overview', '即時概覽'),
    visibleDownstream: getPortalText(language, 'released or active events now visible downstream', '目前已於下游可見的已發佈或進行中活動'),
    releasedDraftEvents: getPortalText(language, 'Released and draft events', '已發佈及草稿活動'),
    releasedDraftDescription: getPortalText(language, 'Events move from Draft to Released or Active after release. Disabled events remain visible, while Closed events disappear from ERP.', '活動發佈後會由 Draft 轉為 Released 或 Active。Disabled 活動仍可見，而 Closed 活動會從 ERP 隱藏。'),
    event: getPortalText(language, 'Event', '活動'),
    partition: getPortalText(language, 'Partition', '分區'),
    registrationWindow: getPortalText(language, 'Registration Window', '登記時段'),
    status: getPortalText(language, 'Status', '狀態'),
    checklist: getPortalText(language, 'Release checklist', '發佈清單'),
    checklistDescription: getPortalText(language, 'Keep the rollout sequence aligned before exposing new booking windows to clients and ERP users.', '在向客戶及 ERP 用戶開放新預約時段前，先確保發佈流程一致。'),
    bookingMovement: getPortalText(language, 'Booking movement', '預約動態'),
    bookingMovementDescription: getPortalText(language, 'Recent appointment activity helps verify whether released events are converting as expected.', '近期預約活動可幫助確認已發佈活動是否如預期轉化。'),
    confirmedBookings: getPortalText(language, 'confirmed bookings across the current appointment dataset', '目前預約資料集中的已確認預約'),
    recentAppointments: getPortalText(language, 'Recent appointments', '最近預約'),
    recentAppointmentsDescription: getPortalText(language, 'The appointment master is a real-time read model over booking data coming from ERP and cancellation actions from EAP / ECP.', '預約主檔是即時讀取模型，整合 ERP 預約資料及來自 EAP / ECP 的取消操作。'),
    booking: getPortalText(language, 'Booking', '預約'),
    participant: getPortalText(language, 'Participant', '參加者'),
    slot: getPortalText(language, 'Date / Slot', '日期 / 時段'),
  };
  const releasedOrActiveEvents = eventRows.filter((event) => /(RELEASED|ACTIVE)/i.test(event.status)).length;
  const confirmedAppointments = appointmentRows.filter((appointment) => /CONFIRMED/i.test(appointment.status)).length;

  return (
    <EapShell
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <Stack gap={24}>
        <section className="portal-dashboard-hero">
          <div className="portal-dashboard-hero-copy">
            <div className="portal-section-label">{copy.ops}</div>
            <h2>{copy.heroTitle}</h2>
            <p>{copy.heroDescription}</p>
            <div className="portal-dashboard-actions">
              <Link href="/events/new" className="btn btn-primary">
                {copy.createEvent}
              </Link>
              <Link href="/appointments" className="btn btn-secondary">
                {copy.reviewBookings}
              </Link>
              <Link href="/templates" className="btn btn-outline-secondary">
                {copy.manageTemplates}
              </Link>
            </div>
          </div>

          <div className="portal-dashboard-panel">
            <div className="portal-dashboard-panel-title">{copy.liveOverview}</div>
            <div className="portal-dashboard-panel-metric">
              <strong>{releasedOrActiveEvents}</strong>
              <span>{copy.visibleDownstream}</span>
            </div>
            <div className="portal-summary-list">
              {eventRows.slice(0, 3).map((event) => (
                <div key={event.documentId} className="portal-summary-item">
                  <div className="portal-summary-item-header">
                    <div>
                      <strong>{event.eventName}</strong>
                      <span>
                        {event.partitionCode} · {event.location}
                      </span>
                    </div>
                    <StatusBadge value={event.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <StatGrid items={stats} />

        <div className="portal-insight-grid">
          <div>
            <Card
              title={copy.releasedDraftEvents}
              description={copy.releasedDraftDescription}
            >
              <SimpleTable
                columns={[
                  { key: 'eventName', label: copy.event },
                  { key: 'partition', label: copy.partition },
                  { key: 'window', label: copy.registrationWindow },
                  { key: 'status', label: copy.status },
                ]}
                rows={eventRows.map((event) => ({
                  eventName: (
                    <div className="portal-table-entity">
                      <div className="portal-table-entity-title">{event.eventName}</div>
                      <div className="portal-table-entity-meta">{event.location}</div>
                    </div>
                  ),
                  partition: event.partitionCode,
                  window: `${event.registrationStartDate} → ${event.registrationEndDate}`,
                  status: <StatusBadge value={event.status} />,
                }))}
              />
            </Card>
          </div>

          <div className="portal-insight-stack">
            <Card
              title={copy.checklist}
              description={copy.checklistDescription}
            >
              <ul className="portal-list-tight">
                <li>{getPortalText(language, 'Generate events from the correct template and review the mandatory fields.', '先由正確模板產生活動，並檢視必填欄位。')}</li>
                <li>{getPortalText(language, 'Confirm slot capacity, release window, and client-facing notice content.', '確認時段名額、發佈時窗及客戶通知內容。')}</li>
                <li>{getPortalText(language, 'Validate partition URLs, QR payloads, and contact details before publishing.', '發佈前先驗證分區網址、二維碼內容及聯絡資料。')}</li>
                <li>{getPortalText(language, 'Keep cancellation and status transitions visible for audit follow-up.', '保留取消及狀態變更記錄，以便審核跟進。')}</li>
              </ul>
            </Card>

            <Card
              title={copy.bookingMovement}
              description={copy.bookingMovementDescription}
            >
              <div className="portal-dashboard-panel-metric">
                <strong>{confirmedAppointments}</strong>
                <span>{copy.confirmedBookings}</span>
              </div>
              <div className="portal-feed-list">
                {appointmentRows.slice(0, 4).map((appointment) => (
                  <div key={appointment.documentId} className="portal-feed-item">
                    <div className="portal-feed-item-header">
                      <div>
                        <strong>{appointment.participantName}</strong>
                        <span>{appointment.bookingReference}</span>
                      </div>
                      <StatusBadge value={appointment.status} />
                    </div>
                    <div className="portal-feed-meta">
                      {appointment.appointmentDate} · {appointment.appointmentStartTime}-{appointment.appointmentEndTime}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card
          title={copy.recentAppointments}
          description={copy.recentAppointmentsDescription}
        >
          <SimpleTable
            columns={[
              { key: 'booking', label: copy.booking },
              { key: 'participant', label: copy.participant },
              { key: 'slot', label: copy.slot },
              { key: 'status', label: copy.status },
            ]}
            rows={appointmentRows.slice(0, 5).map((appointment) => ({
              booking: appointment.bookingReference,
              participant: (
                <div className="portal-table-entity">
                  <div className="portal-table-entity-title">{appointment.participantName}</div>
                  <div className="portal-table-entity-meta">{appointment.registeredEmail ?? appointment.mobileNumber ?? '-'}</div>
                </div>
              ),
              slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
              status: <StatusBadge value={appointment.status} />,
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}
