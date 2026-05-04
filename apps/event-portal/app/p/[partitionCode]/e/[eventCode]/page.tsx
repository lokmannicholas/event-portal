import { EmptyState } from '@event-portal/ui';
import { BookingForm } from '../../../../../components/booking-form';
import { ErpShell } from '../../../../../components/erp-shell';
import { getErpEventDetail } from '../../../../../lib/erp-api';

type PageProps = {
  params: Promise<{ eventCode: string; partitionCode: string }>;
};

export default async function Page({ params }: PageProps) {
  const { eventCode, partitionCode } = await params;
  const detail = await getErpEventDetail(eventCode, partitionCode);

  if (!detail) {
    return (
      <ErpShell title="Event detail" subtitle="The requested event could not be found." partitionCode={partitionCode}>
        <EmptyState title="Event not found" description="Check the partition link, event code, or contact QHMS support for assistance." />
      </ErpShell>
    );
  }

  return (
    <ErpShell
      title="預約服務"
      subtitle={detail.event.eventName}
      partitionCode={partitionCode}
      headerCaption={detail.event.companyName}
    >
      <div className="erp-event-booking-page">
        <section className="erp-event-overview-card">
          <div className="erp-event-overview-copy">
            <span className="erp-event-overview-kicker">Appointment Booking</span>
            <h2>{detail.event.eventName}</h2>
            <p>{detail.event.notes ?? detail.event.description ?? 'Choose the available session and complete the required participant details to secure your booking.'}</p>
          </div>

          <div className="erp-event-overview-stats">
            <div className="erp-event-overview-stat">
              <span>Location</span>
              <strong>{detail.event.location}</strong>
            </div>
            <div className="erp-event-overview-stat">
              <span>Event Window</span>
              <strong>
                {detail.event.eventStartDate} - {detail.event.eventEndDate}
              </strong>
            </div>
            <div className="erp-event-overview-stat">
              <span>Registration Window</span>
              <strong>
                {detail.event.registrationStartDate} - {detail.event.registrationEndDate}
              </strong>
            </div>
          </div>
        </section>

        <BookingForm detail={detail} />
      </div>
    </ErpShell>
  );
}
