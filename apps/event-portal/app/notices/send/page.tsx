import { Card, Stack } from '@event-portal/ui';
import { ActionLink, ActionRow, NoticeBanner } from '../../../components/admin-forms';
import { EapShell } from '../../../components/eap-shell';
import { NoticeSendPanel } from '../../../components/notice-send-panel';
import { getAppointments, getEvents, getNotices } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';

type PageProps = {
  searchParams?: Promise<NoticeQuery & { eventDocumentId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const [events, appointments, notices] = await Promise.all([getEvents(), getAppointments(), getNotices()]);

  return (
    <EapShell title="Send Notices" subtitle="Manually send email or SMS notices to selected appointments or to all appointments under an event.">
      <Stack>
        <ActionRow>
          <ActionLink href="/notices" label="Back to Notice History" variant="secondary" />
        </ActionRow>
        <NoticeBanner code={query.notice} title={query.title} description={query.message} />

        <Card title="Batch notice send" description="Choose an event and notice type. The linked SMS or email template is resolved from the event configuration using each participant's communication preference. Select up to 20 appointments and the system will send them one by one.">
          <NoticeSendPanel
            events={events}
            appointments={appointments}
            notices={notices}
            initialEventDocumentId={query.eventDocumentId}
          />
        </Card>
      </Stack>
    </EapShell>
  );
}
