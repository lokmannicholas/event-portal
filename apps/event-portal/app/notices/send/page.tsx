import { Card, Stack } from '@event-portal/ui';
import { sendNoticeBatchAction } from '../../actions/notice-actions';
import { ActionLink, ActionRow, Field, FormGrid, MultiSelectField, NoticeBanner, SelectField, SubmitRow } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getAppointments, getEvents } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery & { eventDocumentId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const [events, appointments] = await Promise.all([getEvents(), getAppointments()]);

  return (
    <EapShell title="Send Notices" subtitle="Manually send email or SMS notices to selected appointments or to all appointments under an event.">
      <Stack>
        <ActionRow>
          <ActionLink href="/notices" label="Back to Notice History" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Batch notice send" description="Choose an event and notice type. The linked SMS or email template is resolved from the event configuration using each participant's communication preference, then either select appointments explicitly or leave the appointment list empty to target all appointments in the selected event.">
          <form action={sendNoticeBatchAction}>
            <Stack gap={16}>
              <FormGrid>
                <SelectField
                  label="Event"
                  name="eventDocumentId"
                  defaultValue={query.eventDocumentId}
                  options={events.map((event) => ({ value: event.documentId, label: `${event.eventName} · ${event.eventCode}` }))}
                />
                <SelectField
                  label="Notice type"
                  name="noticeType"
                  defaultValue="REGISTRATION"
                  options={[
                    { value: 'REGISTRATION', label: 'REGISTRATION' },
                    { value: 'ANNOUNCEMENT', label: 'ANNOUNCEMENT' },
                    { value: 'EVENT_UPDATE', label: 'EVENT_UPDATE' },
                  ]}
                />
                <Field label="Batch size" name="batchSize" type="number" defaultValue={50} required />
              </FormGrid>

              <MultiSelectField
                label="Appointments"
                name="appointmentDocumentIds"
                size={10}
                options={appointments.map((appointment) => ({
                  value: appointment.documentId,
                  label: `${appointment.bookingReference} · ${appointment.participantName} · ${appointment.eventName} · ${appointment.registeredEmail ?? appointment.mobileNumber ?? 'No contact'}`,
                }))}
              />

              <SubmitRow submitLabel="Send notices" cancelHref="/notices" cancelLabel="Back to history" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}
