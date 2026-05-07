import { Card, EmptyState, KeyValueList, SimpleTable, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { changeEventPublicationAction, updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, BooleanButtonField, Field, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { ErpPathSummary } from '../../../components/erp-path-summary';
import { EventSlotPlanner } from '../../../components/event-slot-planner';
import { getEvent, getNoticeTemplates, getPartitions, getTemplates } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

function formatOptionalBoolean(value: boolean | undefined) {
  console.log('[formatOptionalBoolean] value', value);
  if (value === true) {
    return 'Yes';
  }

  if (value === false) {
    return 'No';
  }

  return '-';
}

function getNotificationTemplate(
  notifications: Array<{ type: string; channel?: string; templateDocumentId?: string }>,
  type: string,
  channel: 'EMAIL' | 'SMS',
) {
  return notifications.find((notification) => notification.type === type && notification.channel === channel);
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [detail, partitionRows, templateRows, noticeTemplateRows] = await Promise.all([
    getEvent(documentId),
    getPartitions(),
    getTemplates(),
    getNoticeTemplates(),
  ]);

  if (!detail) {
    return (
      <EapShell title="Event Detail" subtitle="The requested event record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/events" label="Back to Registration Master" variant="secondary" />
          </ActionRow>
          <EmptyState title="Event not found" description="Check the selected record id or create a new event record." />
        </Stack>
      </EapShell>
    );
  }

  const { event } = detail;
  const defaultQuota = event.dates.flatMap((date) => date.slots)[0]?.quota ?? 10;
  const smsRegistrationNotice = getNotificationTemplate(event.notifications, 'REGISTRATION', 'SMS');
  const smsAnnouncementNotice = getNotificationTemplate(event.notifications, 'ANNOUNCEMENT', 'SMS');
  const smsEventUpdateNotice = getNotificationTemplate(event.notifications, 'EVENT_UPDATE', 'SMS');
  const emailRegistrationNotice = getNotificationTemplate(event.notifications, 'REGISTRATION', 'EMAIL');
  const emailAnnouncementNotice = getNotificationTemplate(event.notifications, 'ANNOUNCEMENT', 'EMAIL');
  const emailEventUpdateNotice = getNotificationTemplate(event.notifications, 'EVENT_UPDATE', 'EMAIL');
  const smsNoticeTemplateOptions = [
    { value: '', label: 'Not linked' },
    ...noticeTemplateRows
      .filter((item) => item.channel === 'SMS')
      .map((item) => ({ value: item.documentId, label: item.name })),
  ];
  const emailNoticeTemplateOptions = [
    { value: '', label: 'Not linked' },
    ...noticeTemplateRows
      .filter((item) => item.channel === 'EMAIL')
      .map((item) => ({ value: item.documentId, label: item.name })),
  ];

  return (
    <EapShell title={event.eventName} subtitle="Update registration event metadata, publishable windows, and operational notes from the detail page.">
      <Stack>
        <ActionRow>
          <ActionLink href="/events" label="Back to Registration Master" variant="secondary" />
          <ActionLink href="/events/new" label="Create event" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="Event detail" description="The update form on this detail page covers the master record fields.">
              <form action={updateRecordAction.bind(null, 'event', event.documentId)}>
                <Stack gap={16}>
                  <FormGrid>
                    <Field label="Event name" name="eventName" defaultValue={event.eventName} required />
                    <Field label="Event code" name="eventCode" defaultValue={event.eventCode} required />
                    <Field label="Company" name="companyName" defaultValue={event.companyName} required />
                    <Field label="Location" name="location" defaultValue={event.location} required />
                    <SelectField
                      label="Partition"
                      name="partitionDocumentId"
                      defaultValue={event.partitionDocumentId}
                      options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
                    />
                    <SelectField
                      label="Template"
                      name="templateDocumentId"
                      defaultValue={event.templateDocumentId}
                      required
                      options={templateRows.map((item) => ({ value: item.documentId, label: `${item.name} · ${item.partitionCodes.join(', ') || 'No partitions'}` }))}
                    />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={event.status}
                      options={['DRAFT', 'RELEASED', 'DISABLED', 'CLOSED'].map((item) => ({ value: item, label: item }))}
                    />
                    <Field label="Registration start" name="registrationStartDate" type="date" defaultValue={event.registrationStartDate} required />
                    <Field label="Registration end" name="registrationEndDate" type="date" defaultValue={event.registrationEndDate} required />
                    <Field label="Event start" name="eventStartDate" type="date" defaultValue={event.eventStartDate} required />
                    <Field label="Event end" name="eventEndDate" type="date" defaultValue={event.eventEndDate} required />
                    <Field label="Day start time" name="dayStartTime" type="time" defaultValue={event.dayStartTime} required />
                    <Field label="Day end time" name="dayEndTime" type="time" defaultValue={event.dayEndTime} required />
                    <BooleanButtonField
                      label="Show in registration period"
                      name="showInRegistrationPeriod"
                      defaultValue={event.showInRegistrationPeriod}
                      helperText="ERP shows this event during the registration window only when this is enabled."
                    />
                    <BooleanButtonField
                      label="Show in event period"
                      name="showInEventPeriod"
                      defaultValue={event.showInEventPeriod}
                      helperText="ERP shows this event during the event dates only when this is enabled."
                    />
                    <BooleanButtonField
                      label="Show in expired"
                      name="showInExpired"
                      defaultValue={event.showInExpired}
                      helperText="ERP keeps this event visible after the event end date when this is enabled."
                    />
                    <Field label="Reminder offset days" name="reminderOffsetDays" type="number" defaultValue={event.reminderOffsetDays} required />
                  </FormGrid>

                  <TextAreaField label="Description" name="description" defaultValue={event.description} rows={3} />
                  <TextAreaField label="Event notes" name="notes" defaultValue={event.notes} rows={3} />
                  <FormGrid>
                    <SelectField
                      label="SMS Registration notice template"
                      name="smsRegistrationNoticeTemplateDocumentId"
                      defaultValue={smsRegistrationNotice?.templateDocumentId ?? ''}
                      options={smsNoticeTemplateOptions}
                    />
                    <SelectField
                      label="SMS Announcement notice template"
                      name="smsAnnouncementNoticeTemplateDocumentId"
                      defaultValue={smsAnnouncementNotice?.templateDocumentId ?? ''}
                      options={smsNoticeTemplateOptions}
                    />
                    <SelectField
                      label="SMS Event update notice template"
                      name="smsEventUpdateNoticeTemplateDocumentId"
                      defaultValue={smsEventUpdateNotice?.templateDocumentId ?? ''}
                      options={smsNoticeTemplateOptions}
                    />
                    <SelectField
                      label="EMAIL Registration notice template"
                      name="emailRegistrationNoticeTemplateDocumentId"
                      defaultValue={emailRegistrationNotice?.templateDocumentId ?? ''}
                      options={emailNoticeTemplateOptions}
                    />
                    <SelectField
                      label="EMAIL Announcement notice template"
                      name="emailAnnouncementNoticeTemplateDocumentId"
                      defaultValue={emailAnnouncementNotice?.templateDocumentId ?? ''}
                      options={emailNoticeTemplateOptions}
                    />
                    <SelectField
                      label="EMAIL Event update notice template"
                      name="emailEventUpdateNoticeTemplateDocumentId"
                      defaultValue={emailEventUpdateNotice?.templateDocumentId ?? ''}
                      options={emailNoticeTemplateOptions}
                    />
                  </FormGrid>
                  <EventSlotPlanner initialDates={event.dates} defaultQuota={defaultQuota} defaultDurationMinutes={30} />

                  <SubmitRow submitLabel="Update event" cancelHref="/events" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Publishing summary" description="Current event metadata and outbound access pointers.">
              <Stack gap={16}>
                <KeyValueList
                  items={[
                    { label: 'Document id', value: event.documentId },
                    { label: 'Status', value: <StatusBadge value={event.status} /> },
                    { label: 'Published to ERP', value: event.publishedToPortals ? 'Yes' : 'No' },
                    { label: 'Partition', value: event.partitionCode },
                    { label: 'Layout mode', value: event.layoutMode ?? 'TWO_COLUMN' },
                    { label: 'Show in registration period', value: formatOptionalBoolean(event.showInRegistrationPeriod) },
                    { label: 'Show in event period', value: formatOptionalBoolean(event.showInEventPeriod) },
                    { label: 'Show in expired', value: formatOptionalBoolean(event.showInExpired) },
                    { label: 'Public URL', value: <a href={event.publicUrl}>{event.publicUrl}</a> },
                    { label: 'QR payload', value: <ErpPathSummary url={event.qrPayload} /> },
                  ]}
                />
                <ActionRow>
                  <form action={changeEventPublicationAction.bind(null, event.documentId, 'publish')}>
                    <button type="submit" className="btn btn-primary">
                      Publish
                    </button>
                  </form>
                  <form action={changeEventPublicationAction.bind(null, event.documentId, 'unpublish')}>
                    <button type="submit" className="btn btn-outline-secondary">
                      Unpublish
                    </button>
                  </form>
                  <form action={changeEventPublicationAction.bind(null, event.documentId, 'disable')}>
                    <button type="submit" className="btn btn-outline-secondary">
                      Disable
                    </button>
                  </form>
                </ActionRow>
              </Stack>
            </Card>
          }
        />

        <Card title="Date and slot summary" description="Slot-level availability remains visible from the current record detail.">
          <SimpleTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'startTime', label: 'Start time' },
              { key: 'endTime', label: 'End time' },
              { key: 'enabled', label: 'Enabled' },
              { key: 'quota', label: 'Quota' },
              { key: 'used', label: 'Used' },
              { key: 'held', label: 'Held' },
              { key: 'remaining', label: 'Remaining' },
            ]}
            rows={event.dates.flatMap((date) =>
              date.slots.map((slot) => ({
                date: date.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                enabled: date.enabled && slot.enabled ? 'Yes' : 'No',
                quota: String(slot.quota),
                used: String(slot.usedCount),
                held: String(slot.holdCount),
                remaining: String(slot.remaining),
              })),
            )}
          />
        </Card>

        <Card title="Notice template mapping" description="Each event notice type resolves independently for SMS and email delivery.">
          <SimpleTable
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'template', label: 'Template' },
              { key: 'channel', label: 'Channel' },
              { key: 'subject', label: 'Subject' },
            ]}
            rows={event.notifications.map((notification) => ({
              type: notification.type,
              template: notification.templateName ?? '-',
              channel: notification.channel ?? '-',
              subject: notification.subject ?? '-',
            }))}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}
