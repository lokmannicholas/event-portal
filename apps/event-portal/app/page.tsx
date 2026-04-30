import Link from 'next/link';
import { Card, SimpleTable, Stack, StatGrid, StatusBadge } from '@flu-vax/ui';
import { EapShell } from '../components/eap-shell';
import { getAppointments, getDashboard, getEvents } from '../lib/api';

export default async function Page() {
  const [dashboard, eventRows, appointmentRows] = await Promise.all([
    getDashboard(),
    getEvents(),
    getAppointments(),
  ]);
  const releasedOrActiveEvents = eventRows.filter((event) => /(RELEASED|ACTIVE)/i.test(event.status)).length;
  const confirmedAppointments = appointmentRows.filter((appointment) => /CONFIRMED/i.test(appointment.status)).length;

  return (
    <EapShell
      title="Dashboard"
      subtitle="Admin entry point for partitions, templates, event release, appointments, portal documents, and support content."
    >
      <Stack gap={24}>
        <section className="portal-dashboard-hero">
          <div className="portal-dashboard-hero-copy">
            <div className="portal-section-label">EAP Operations</div>
            <h2>Vaccination campaign control centre</h2>
            <p>
              Prepare event templates, release registration windows, and monitor bookings across the admin, client,
              and public registration portals from one workspace.
            </p>
            <div className="portal-dashboard-actions">
              <Link href="/events/new" className="btn btn-primary">
                Create event
              </Link>
              <Link href="/appointments" className="btn btn-secondary">
                Review bookings
              </Link>
              <Link href="/templates" className="btn btn-outline-secondary">
                Manage templates
              </Link>
            </div>
          </div>

          <div className="portal-dashboard-panel">
            <div className="portal-dashboard-panel-title">Live overview</div>
            <div className="portal-dashboard-panel-metric">
              <strong>{releasedOrActiveEvents}</strong>
              <span>released or active events now visible downstream</span>
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

        <StatGrid items={dashboard.stats} />

        <div className="portal-insight-grid">
          <div>
            <Card
              title="Released and draft events"
              description="Events move from Draft to Released or Active after release. Disabled events remain visible, while Closed events disappear from ERP."
            >
              <SimpleTable
                columns={[
                  { key: 'eventName', label: 'Event' },
                  { key: 'partition', label: 'Partition' },
                  { key: 'window', label: 'Registration Window' },
                  { key: 'status', label: 'Status' },
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
              title="Release checklist"
              description="Keep the rollout sequence aligned before exposing new booking windows to clients and ERP users."
            >
              <ul className="portal-list-tight">
                <li>Generate events from the correct template and review the mandatory fields.</li>
                <li>Confirm slot capacity, release window, and client-facing notice content.</li>
                <li>Validate partition URLs, QR payloads, and contact details before publishing.</li>
                <li>Keep cancellation and status transitions visible for audit follow-up.</li>
              </ul>
            </Card>

            <Card
              title="Booking movement"
              description="Recent appointment activity helps verify whether released events are converting as expected."
            >
              <div className="portal-dashboard-panel-metric">
                <strong>{confirmedAppointments}</strong>
                <span>confirmed bookings across the current appointment dataset</span>
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
          title="Recent appointments"
          description="The appointment master is a real-time read model over booking data coming from ERP and cancellation actions from EAP / ECP."
        >
          <SimpleTable
            columns={[
              { key: 'booking', label: 'Booking' },
              { key: 'participant', label: 'Participant' },
              { key: 'slot', label: 'Date / Slot' },
              { key: 'status', label: 'Status' },
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
