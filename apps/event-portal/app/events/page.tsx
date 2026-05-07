import { ActionLink, ActionRow } from '../../components/admin-forms';
import { Card, PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import { duplicateEventAction } from '../actions/eap-record-actions';
import { EapShell } from '../../components/eap-shell';
import { getEvents } from '../../lib/api';
import { paginateItems } from '../../lib/pagination';

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 3h9a2 2 0 0 1 2 2v11h-2V5H9V3Zm-3 4h9a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h9V9H6Z"
        fill="currentColor"
      />
    </svg>
  );
}

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const data = await getEvents();
  const pagination = paginateItems(data, query);

  return (
    <EapShell
      title="Event Registration Master"
      subtitle="Editable generated events, registration windows, public availability rules, event lifecycle status, and event-code based ERP links."
    >
      <Stack>
        <ActionRow>
          <ActionLink href="/events/new" label="Create event" />
        </ActionRow>

        <Card title="Generated events" description="This screen maps to the editable registration form. Dates and timeslots can be enabled or disabled after generation. Open a record to update it.">
          <SimpleTable
            columns={[
              { key: 'event', label: 'Event' },
              { key: 'eventCode', label: 'Event Code' },
              { key: 'partition', label: 'Partition' },
              { key: 'eventWindow', label: 'Event Window' },
              { key: 'registrationWindow', label: 'Registration Window' },
              { key: 'status', label: 'Status' },
              { key: 'publicUrl', label: 'Public URL' },
              { key: 'detail', label: 'Detail' },
              { key: 'copy', label: 'Copy' },
            ]}
            rows={pagination.items.map((event) => ({
              event: (
                <div>
                  <div style={{ fontWeight: 700 }}>
                    <a href={`/events/${event.documentId}`}>{event.eventName}</a>
                  </div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>{event.companyName} · {event.location}</div>
                </div>
              ),
              eventCode: event.eventCode,
              partition: event.partitionCode,
              eventWindow: `${event.eventStartDate} → ${event.eventEndDate}`,
              registrationWindow: `${event.registrationStartDate} → ${event.registrationEndDate}`,
              status: <StatusBadge value={event.status} />,
              publicUrl: <a href={event.publicUrl}>{event.publicUrl}</a>,
              detail: <a href={`/events/${event.documentId}`}>Open record</a>,
              copy: (
                <form action={duplicateEventAction.bind(null, event.documentId)}>
                  <button
                    type="submit"
                    className="btn btn-outline-secondary"
                    aria-label={`Duplicate ${event.eventName}`}
                    title="Duplicate event"
                    style={{ padding: '0.45rem 0.55rem', lineHeight: 0 }}
                  >
                    <CopyIcon />
                  </button>
                </form>
              ),
            }))}
          />
          <PaginationControls basePath="/events" searchParams={query} pagination={pagination} itemLabel="events" />
        </Card>
      </Stack>
    </EapShell>
  );
}
