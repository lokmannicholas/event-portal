import { Card, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, BooleanButtonField, Field, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { EventSlotPlanner } from '../../../components/event-slot-planner';
import type { EventCreateDraft } from '../../../lib/eap-create-drafts';
import { readCreateDraft } from '../../../lib/eap-create-drafts';
import { getNoticeTemplates, getPartitions, getTemplates } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

function parseDraftBooleanValue(value: string | undefined) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const draft = query.notice === 'create-failed' ? await readCreateDraft<EventCreateDraft>('event') : undefined;
  const [partitionRows, templateRows, noticeTemplateRows] = await Promise.all([getPartitions(), getTemplates(), getNoticeTemplates()]);
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
    <EapShell title="Create Event" subtitle="Create a registration event record that can later be released to ERP and surfaced to ECP.">
      <Stack>
        <ActionRow>
          <ActionLink href="/events" label="Back to Registration Master" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Event setup" description="Choose the registration template first. It controls the fields, layout mode, and CSS used by the event registration form.">
          <form action={createRecordAction.bind(null, 'event')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Event name" name="eventName" defaultValue={draft?.eventName} required />
                <Field label="Event code" name="eventCode" defaultValue={draft?.eventCode} required />
                <SelectField
                  label="ERP URL type"
                  name="accessType"
                  defaultValue={draft?.accessType ?? 'PUBLIC'}
                  options={[
                    { value: 'PUBLIC', label: 'Public · /e/public/{uuid}' },
                    { value: 'PRIVATE', label: 'Private · /e/private/{uuid}' },
                  ]}
                />
                <Field label="Company" name="companyName" defaultValue={draft?.companyName} required />
                <Field label="Location" name="location" defaultValue={draft?.location} required />
                <SelectField
                  label="Partition"
                  name="partitionDocumentId"
                  defaultValue={draft?.partitionDocumentId}
                  options={partitionRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))}
                />
                <SelectField
                  label="Template"
                  name="templateDocumentId"
                  defaultValue={draft?.templateDocumentId}
                  required
                  options={templateRows.map((item) => ({ value: item.documentId, label: item.name }))}
                />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={draft?.status ?? 'DRAFT'}
                  options={['DRAFT', 'RELEASED', 'DISABLED', 'CLOSED'].map((item) => ({ value: item, label: item }))}
                />
                <Field label="Registration start" name="registrationStartDate" type="date" defaultValue={draft?.registrationStartDate} required />
                <Field label="Registration end" name="registrationEndDate" type="date" defaultValue={draft?.registrationEndDate} required />
                <Field label="Event start" name="eventStartDate" type="date" defaultValue={draft?.eventStartDate} required />
                <Field label="Event end" name="eventEndDate" type="date" defaultValue={draft?.eventEndDate} required />
                <Field label="Day start time" name="dayStartTime" type="time" defaultValue={draft?.dayStartTime ?? '09:00'} required />
                <Field label="Day end time" name="dayEndTime" type="time" defaultValue={draft?.dayEndTime ?? '18:00'} required />
                <BooleanButtonField
                  label="Show in registration period"
                  name="showInRegistrationPeriod"
                  defaultValue={parseDraftBooleanValue(draft?.showInRegistrationPeriod)}
                  helperText="ERP shows this event during the registration window only when this is enabled."
                />
                <BooleanButtonField
                  label="Show in event period"
                  name="showInEventPeriod"
                  defaultValue={parseDraftBooleanValue(draft?.showInEventPeriod)}
                  helperText="ERP shows this event during the event dates only when this is enabled."
                />
                <BooleanButtonField
                  label="Show in expired"
                  name="showInExpired"
                  defaultValue={parseDraftBooleanValue(draft?.showInExpired)}
                  helperText="ERP keeps this event visible after the event end date when this is enabled."
                />
                <Field label="Reminder offset days" name="reminderOffsetDays" type="number" defaultValue={draft?.reminderOffsetDays ?? 2} required />
              </FormGrid>

              <TextAreaField label="Description" name="description" defaultValue={draft?.description} rows={3} />
              <TextAreaField label="Event notes" name="notes" defaultValue={draft?.notes} rows={3} />
              <FormGrid>
                <SelectField
                  label="SMS Registration notice template"
                  name="smsRegistrationNoticeTemplateDocumentId"
                  defaultValue={draft?.smsRegistrationNoticeTemplateDocumentId ?? ''}
                  options={smsNoticeTemplateOptions}
                />
                <SelectField
                  label="SMS Announcement notice template"
                  name="smsAnnouncementNoticeTemplateDocumentId"
                  defaultValue={draft?.smsAnnouncementNoticeTemplateDocumentId ?? ''}
                  options={smsNoticeTemplateOptions}
                />
                <SelectField
                  label="SMS Event update notice template"
                  name="smsEventUpdateNoticeTemplateDocumentId"
                  defaultValue={draft?.smsEventUpdateNoticeTemplateDocumentId ?? ''}
                  options={smsNoticeTemplateOptions}
                />
                <SelectField
                  label="EMAIL Registration notice template"
                  name="emailRegistrationNoticeTemplateDocumentId"
                  defaultValue={draft?.emailRegistrationNoticeTemplateDocumentId ?? ''}
                  options={emailNoticeTemplateOptions}
                />
                <SelectField
                  label="EMAIL Announcement notice template"
                  name="emailAnnouncementNoticeTemplateDocumentId"
                  defaultValue={draft?.emailAnnouncementNoticeTemplateDocumentId ?? ''}
                  options={emailNoticeTemplateOptions}
                />
                <SelectField
                  label="EMAIL Event update notice template"
                  name="emailEventUpdateNoticeTemplateDocumentId"
                  defaultValue={draft?.emailEventUpdateNoticeTemplateDocumentId ?? ''}
                  options={emailNoticeTemplateOptions}
                />
              </FormGrid>

              <EventSlotPlanner initialDraftJson={draft?.slotPlanJson} defaultQuota={10} defaultDurationMinutes={30} />

              <SubmitRow submitLabel="Create event" cancelHref="/events" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}
