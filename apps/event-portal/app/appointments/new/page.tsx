import { Card, Stack } from '@event-portal/ui';
import { createRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, NoticeBanner, SelectField, SubmitRow } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getEvents } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const eventRows = await getEvents();

  return (
    <EapShell title="Create Appointment" subtitle="Create a booking record in the appointment master for operational correction or admin-side entry.">
      <Stack>
        <ActionRow>
          <ActionLink href="/appointments" label="Back to Appointment Master" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Appointment setup" description="The event selector uses the current event record ids available to EAP.">
          <form action={createRecordAction.bind(null, 'appointment')}>
            <Stack gap={16}>
              <FormGrid>
                <Field label="Booking reference" name="bookingReference" required />
                <Field label="Participant name" name="participantName" required />
                <Field label="Staff number" name="staffNumber" />
                <Field label="Medical card number" name="medicalCardNumber" />
                <Field label="HKID / Passport prefix" name="hkidPrefix" />
                <Field label="Registered email" name="registeredEmail" type="email" />
                <Field label="Mobile number" name="mobileNumber" />
                <SelectField
                  label="Communication preference"
                  name="communicationPreference"
                  defaultValue="EMAIL"
                  options={[
                    { value: 'EMAIL', label: 'EMAIL' },
                    { value: 'SMS', label: 'SMS' },
                  ]}
                />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue="CONFIRMED"
                  options={['CONFIRMED', 'CANCELLED', 'EXPIRED'].map((item) => ({ value: item, label: item }))}
                />
                <Field label="Appointment date" name="appointmentDate" type="date" required />
                <Field label="Start time" name="appointmentStartTime" type="time" required />
                <Field label="End time" name="appointmentEndTime" type="time" required />
                <Field label="Quota snapshot" name="quota" type="number" defaultValue={10} required />
                <SelectField
                  label="Portal source"
                  name="portalSource"
                  defaultValue="EAP"
                  options={['EAP', 'ECP', 'ERP'].map((item) => ({ value: item, label: item }))}
                />
                <SelectField
                  label="Event record"
                  name="eventDocumentId"
                  options={eventRows.map((item) => ({ value: item.documentId, label: `${item.eventName} · ${item.documentId}` }))}
                />
              </FormGrid>

              <SubmitRow submitLabel="Create appointment" cancelHref="/appointments" cancelLabel="Cancel" />
            </Stack>
          </form>
        </Card>
      </Stack>
    </EapShell>
  );
}
