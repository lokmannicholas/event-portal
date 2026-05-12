import { Card, EmptyState, KeyValueList, SimpleTable, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { EcpAppointmentTable } from '../../../../../components/ecp-appointment-table';
import { EcpShell } from '../../../../../components/ecp-shell';
import { ErpPathSummary } from '../../../../../components/erp-path-summary';
import { getEcpAppointmentsForEvent, getEcpEventDetail } from '../../../../../lib/ecp-api';
import { getPortalText } from '../../../../../lib/portal-language';
import { getPortalLanguageFromCookies } from '../../../../../lib/portal-language.server';

type PageProps = {
  params: Promise<{ eventCode: string; groupCode: string }>;
};

function formatDisplayTime(value: string | undefined) {
  if (!value) {
    return '-';
  }

  return value.slice(0, 5);
}

export default async function Page({ params }: PageProps) {
  const { eventCode, groupCode } = await params;
  const language = await getPortalLanguageFromCookies();
  const detail = await getEcpEventDetail(eventCode, groupCode);
  const copy = {
    missingTitle: getPortalText(language, 'Event detail', '活動詳情'),
    missingSubtitle: getPortalText(language, 'Requested event could not be found.', '找不到所要求的活動。'),
    missingDescription: getPortalText(language, 'Check the event code or make sure the event belongs to this client group scope.', '請檢查活動代碼，或確認該活動屬於此客戶群組範圍。'),
    subtitle: getPortalText(language, 'Client view over ERP registration output, event metadata, and appointment records.', '客戶檢視 ERP 登記結果、活動資料及預約記錄。'),
    detailTitle: getPortalText(language, 'Event detail', '活動詳情'),
    detailDescription: getPortalText(language, 'The client portal can open the ERP public registration page, display QR payload scope, and review registrations.', '客戶入口可開啟 ERP 公開登記頁面、顯示二維碼內容範圍及檢視登記記錄。'),
    eventCode: getPortalText(language, 'Event code', '活動代碼'),
    company: getPortalText(language, 'Company', '公司'),
    location: getPortalText(language, 'Location', '地點'),
    partition: getPortalText(language, 'Partition', '分區'),
    registrationStart: getPortalText(language, 'Registration start', '登記開始'),
    registrationEnd: getPortalText(language, 'Registration end', '登記結束'),
    eventStart: getPortalText(language, 'Event start', '活動開始'),
    eventEnd: getPortalText(language, 'Event end', '活動結束'),
    dayStartTime: getPortalText(language, 'Day start time', '每日開始時間'),
    dayEndTime: getPortalText(language, 'Day end time', '每日結束時間'),
    status: getPortalText(language, 'Status', '狀態'),
    erpUrl: getPortalText(language, 'ERP URL', 'ERP 網址'),
    qrPayload: getPortalText(language, 'QR payload', '二維碼內容'),
    participantFields: getPortalText(language, 'Participant fields', '參加者欄位'),
    participantFieldsDescription: getPortalText(language, 'These fields come from the event schema snapshot created from the template.', '這些欄位來自根據模板建立的活動欄位快照。'),
    required: getPortalText(language, '(required)', '（必填）'),
    optional: getPortalText(language, '(optional)', '（選填）'),
    timeslotAvailability: getPortalText(language, 'Timeslot availability', '時段可用情況'),
    timeslotDescription: getPortalText(language, 'Registration slots remain visible here with the configured quota and current remaining availability.', '登記時段會在此顯示其設定配額及目前剩餘名額。'),
    noTimeslots: getPortalText(language, 'No timeslots configured', '未設定時段'),
    noTimeslotsDescription: getPortalText(language, 'This event does not have any available slot rows yet.', '此活動目前尚未設定任何時段。'),
    date: getPortalText(language, 'Date', '日期'),
    timeslot: getPortalText(language, 'Timeslot', '時段'),
    enabled: getPortalText(language, 'Enabled', '啟用'),
    quota: getPortalText(language, 'Quota', '配額'),
    remaining: getPortalText(language, 'Remaining', '剩餘'),
    appointments: getPortalText(language, 'Appointments', '預約'),
    appointmentsDescription: getPortalText(language, 'HR cancellation remains visible in history and should trigger quota release and participant notification.', 'HR 取消記錄會保留在歷史中，並應觸發配額釋放及參加者通知。'),
  };

  if (!detail) {
    return (
      <EcpShell title={copy.missingTitle} subtitle={copy.missingSubtitle} groupCode={groupCode}>
        <EmptyState title={getPortalText(language, 'Event not found', '找不到活動')} description={copy.missingDescription} />
      </EcpShell>
    );
  }

  const appointments = await getEcpAppointmentsForEvent(eventCode, groupCode);
  const slotRows = detail.event.dates.flatMap((date) =>
    date.slots.map((slot) => ({
      date: date.date,
      time: `${formatDisplayTime(slot.startTime)}-${formatDisplayTime(slot.endTime)}`,
      enabled: date.enabled && slot.enabled ? 'Yes' : 'No',
      quota: String(slot.quota),
      remaining: String(slot.remaining),
    })),
  );

  return (
    <EcpShell
      title={detail.event.eventName}
      subtitle={copy.subtitle}
      groupCode={groupCode}
    >
      <Stack>
        <SplitGrid
          left={
            <Card title={copy.detailTitle} description={copy.detailDescription}>
              <KeyValueList
                items={[
                  { label: copy.eventCode, value: detail.event.eventCode },
                  { label: copy.company, value: detail.event.companyName },
                  { label: copy.location, value: detail.event.location },
                  { label: copy.partition, value: detail.event.partitionCode },
                  { label: copy.registrationStart, value: detail.event.registrationStartDate },
                  { label: copy.registrationEnd, value: detail.event.registrationEndDate },
                  { label: copy.eventStart, value: detail.event.eventStartDate },
                  { label: copy.eventEnd, value: detail.event.eventEndDate },
                  { label: copy.dayStartTime, value: formatDisplayTime(detail.event.dayStartTime) },
                  { label: copy.dayEndTime, value: formatDisplayTime(detail.event.dayEndTime) },
                  { label: copy.status, value: <StatusBadge value={detail.event.status} /> },
                  { label: copy.erpUrl, value: <a href={detail.event.publicUrl}>{detail.event.publicUrl}</a> },
                  { label: copy.qrPayload, value: <ErpPathSummary url={detail.event.qrPayload} language={language} /> },
                ]}
              />
            </Card>
          }
          right={
            <Card title={copy.participantFields} description={copy.participantFieldsDescription}>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                {detail.event.fields.map((field) => (
                  <li key={field.fieldKey}>
                    {field.labelEn} {field.required ? copy.required : copy.optional}
                  </li>
                ))}
              </ul>
            </Card>
          }
        />

        <Card title={copy.timeslotAvailability} description={copy.timeslotDescription}>
          {slotRows.length === 0 ? (
            <EmptyState title={copy.noTimeslots} description={copy.noTimeslotsDescription} />
          ) : (
            <SimpleTable
              columns={[
                { key: 'date', label: copy.date },
                { key: 'time', label: copy.timeslot },
                { key: 'enabled', label: copy.enabled },
                { key: 'quota', label: copy.quota },
                { key: 'remaining', label: copy.remaining },
              ]}
              rows={slotRows}
            />
          )}
        </Card>

        <Card title={copy.appointments} description={copy.appointmentsDescription}>
          <EcpAppointmentTable appointments={appointments} groupCode={groupCode} eventCode={eventCode} language={language} />
        </Card>
      </Stack>
    </EcpShell>
  );
}
