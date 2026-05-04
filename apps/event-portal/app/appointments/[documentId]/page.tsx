import { Card, EmptyState, KeyValueList, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FormGrid, NoticeBanner, SelectField, SubmitRow } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { getAppointment, getEvents } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, eventRows] = await Promise.all([getAppointment(documentId), getEvents()]);

  if (!record) {
    return (
      <EapShell title="Appointment Detail" subtitle="The requested appointment record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/appointments" label="Back to Appointment Master" variant="secondary" />
          </ActionRow>
          <EmptyState title="Appointment not found" description="Check the selected booking record id or create a new appointment record." />
        </Stack>
      </EapShell>
    );
  }

  return (
    <EapShell title={record.bookingReference} subtitle="Update participant, booking status, and slot metadata directly from the appointment detail page.">
      <Stack>
        <ActionRow>
          <ActionLink href="/appointments" label="Back to Appointment Master" variant="secondary" />
          <ActionLink href="/appointments/new" label="Create appointment" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="Appointment detail" description="Update the booking record from this detail page.">
              <form action={updateRecordAction.bind(null, 'appointment', record.documentId)}>
                <Stack gap={16}>
                  <FormGrid>
                    <Field label="Booking reference" name="bookingReference" defaultValue={record.bookingReference} required />
                    <Field label="Participant name" name="participantName" defaultValue={record.participantName} required />
                    <Field label="Staff number" name="staffNumber" defaultValue={record.staffNumber} />
                    <Field label="Medical card number" name="medicalCardNumber" defaultValue={record.medicalCardNumber} />
                    <Field label="HKID / Passport prefix" name="hkidPrefix" defaultValue={record.hkidPrefix} />
                    <Field label="Registered email" name="registeredEmail" type="email" defaultValue={record.registeredEmail} />
                    <Field label="Mobile number" name="mobileNumber" defaultValue={record.mobileNumber} />
                    <SelectField
                      label="Communication preference"
                      name="communicationPreference"
                      defaultValue={record.communicationPreference}
                      options={[
                        { value: 'EMAIL', label: 'EMAIL' },
                        { value: 'SMS', label: 'SMS' },
                      ]}
                    />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={record.status}
                      options={['CONFIRMED', 'CANCELLED', 'EXPIRED'].map((item) => ({ value: item, label: item }))}
                    />
                    <Field label="Appointment date" name="appointmentDate" type="date" defaultValue={record.appointmentDate} required />
                    <Field label="Start time" name="appointmentStartTime" type="time" defaultValue={record.appointmentStartTime} required />
                    <Field label="End time" name="appointmentEndTime" type="time" defaultValue={record.appointmentEndTime} required />
                    <Field label="Quota snapshot" name="quota" type="number" defaultValue={record.quota} required />
                    <SelectField
                      label="Portal source"
                      name="portalSource"
                      defaultValue={record.portalSource}
                      options={['EAP', 'ECP', 'ERP'].map((item) => ({ value: item, label: item }))}
                    />
                    <SelectField
                      label="Event record"
                      name="eventDocumentId"
                      defaultValue={record.eventDocumentId}
                      options={eventRows.map((item) => ({ value: item.documentId, label: `${item.eventName} · ${item.documentId}` }))}
                    />
                  </FormGrid>

                  <SubmitRow submitLabel="Update appointment" cancelHref="/appointments" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Booking summary" description="Current booking metadata and downstream audit values.">
              <KeyValueList
                items={[
                  { label: 'Status', value: <StatusBadge value={record.status} /> },
                  { label: 'Event', value: record.eventName },
                  { label: 'Company', value: record.companyName },
                  { label: 'Portal source', value: record.portalSource },
                  { label: 'Cancel token', value: record.cancelToken ?? '-' },
                  { label: 'Remaining after booking', value: record.remainingAfterBooking ?? '-' },
                ]}
              />
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}
