import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { EapShell } from '../../components/eap-shell';
import { getAppointments } from '../../lib/api';
import { getPortalText } from '../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../lib/portal-language.server';
import { paginateItems } from '../../lib/pagination';

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const language = await getPortalLanguageFromCookies();
  const data = await getAppointments();
  const pagination = paginateItems(data, query);
  const copy = {
    title: getPortalText(language, 'Event Appointment Master', '活動預約主檔'),
    subtitle: getPortalText(language, 'Cross-portal booking records, cancellation state, and participant snapshot fields.', '跨入口預約記錄、取消狀態及參加者快照欄位。'),
    createAppointment: getPortalText(language, 'Create appointment', '建立預約'),
    cardTitle: getPortalText(language, 'Appointments', '預約'),
    cardDescription: getPortalText(language, 'Cancellation should release capacity, notify the participant, and keep the historical record. Open a booking to update it.', '取消操作應釋放名額、通知參加者，並保留歷史記錄。開啟預約以更新。'),
    reference: getPortalText(language, 'Reference', '編號'),
    event: getPortalText(language, 'Event', '活動'),
    participant: getPortalText(language, 'Participant', '參加者'),
    contact: getPortalText(language, 'Contact', '聯絡方式'),
    slot: getPortalText(language, 'Date / Slot', '日期 / 時段'),
    status: getPortalText(language, 'Status', '狀態'),
    detail: getPortalText(language, 'Detail', '詳情'),
    openRecord: getPortalText(language, 'Open record', '開啟記錄'),
    staff: getPortalText(language, 'Staff', '員工'),
    itemLabel: getPortalText(language, 'appointments', '預約'),
  };

  return (
    <EapShell
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/appointments/new" label={copy.createAppointment} />
        </ActionRow>

        <Card title={copy.cardTitle} description={copy.cardDescription}>
          <SimpleTable
            columns={[
              { key: 'reference', label: copy.reference },
              { key: 'event', label: copy.event },
              { key: 'participant', label: copy.participant },
              { key: 'contact', label: copy.contact },
              { key: 'slot', label: copy.slot },
              { key: 'status', label: copy.status },
              { key: 'detail', label: copy.detail },
            ]}
            rows={pagination.items.map((appointment) => ({
              reference: <a href={`/appointments/${appointment.documentId}`}>{appointment.bookingReference}</a>,
              event: appointment.eventName,
              participant: (
                <div>
                  <div style={{ fontWeight: 700 }}>{appointment.participantName}</div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>{copy.staff}: {appointment.staffNumber ?? '-'}</div>
                </div>
              ),
              contact: appointment.registeredEmail ?? appointment.mobileNumber ?? '-',
              slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
              status: <StatusBadge value={appointment.status} />,
              detail: <a href={`/appointments/${appointment.documentId}`}>{copy.openRecord}</a>,
            }))}
          />
          <PaginationControls basePath="/appointments" searchParams={query} pagination={pagination} itemLabel={copy.itemLabel} language={language} />
        </Card>
      </Stack>
    </EapShell>
  );
}
