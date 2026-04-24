import { Card, EmptyState, SimpleTable, Stack, StatusBadge } from '@flu-vax/ui';
import { ErpShell } from '../../../components/erp-shell';
import { getErpLanding } from '../../../lib/erp-api';
import { toAbsoluteStrapiMediaUrl } from '../../../lib/strapi-media';

type PageProps = {
  params: Promise<{ partitionCode: string }>;
};

function hasResolvedMediaUrl<T extends { url?: string }>(value: T): value is T & { url: string } {
  return typeof value.url === 'string' && value.url.length > 0;
}

export default async function Page({ params }: PageProps) {
  const { partitionCode } = await params;
  const landing = await getErpLanding(partitionCode);

  if (!landing || landing.events.length === 0) {
    return (
      <ErpShell title="Vaccination Event Master" subtitle="No accessible event could be found for the selected partition." partitionCode={partitionCode}>
        <EmptyState
          title="No event can be access"
          description="There is currently no non-closed event mapped to this partition. Check the QR code or contact QHMS support."
        />
      </ErpShell>
    );
  }

  const logoUrl = toAbsoluteStrapiMediaUrl(landing.partition.logo?.url);
  const bannerUrls = landing.partition.banners
    .map((banner) => ({
      ...banner,
      url: toAbsoluteStrapiMediaUrl(banner.url),
    }))
    .filter(hasResolvedMediaUrl);

  return (
    <ErpShell
      title={`${landing.partition.code} events`}
      subtitle="Participants see all non-closed events within the scanned partition. Disabled events remain visible but are not bookable."
      partitionCode={landing.partition.code}
    >
      <Stack>
        {logoUrl || bannerUrls.length > 0 ? (
          <Card title="Company branding" description="Assets uploaded for this partition are displayed here for ERP visitors.">
            <div className="portal-branding-display">
              {logoUrl ? (
                <div className="portal-branding-logo">
                  <img src={logoUrl} alt={landing.partition.logo?.alternativeText ?? `${landing.partition.code} logo`} />
                </div>
              ) : null}
              {bannerUrls.length > 0 ? (
                <div className="portal-branding-banner-grid">
                  {bannerUrls.map((banner) => (
                    <img key={banner.documentId ?? banner.url} src={banner.url} alt={banner.alternativeText ?? banner.name} />
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        <Card title="Event list" description="Choose an event to view its details, available slots, and registration form.">
          <SimpleTable
            columns={[
              { key: 'event', label: 'Event' },
              { key: 'location', label: 'Location' },
              { key: 'window', label: 'Event Window' },
              { key: 'status', label: 'Status' },
              { key: 'open', label: 'Open' },
            ]}
            rows={landing.events.map((event) => ({
              event: event.eventName,
              location: event.location,
              window: `${event.eventStartDate} → ${event.eventEndDate}`,
              status: <StatusBadge value={event.status} />,
              open: <a href={event.publicUrl}>Register</a>,
            }))}
          />
        </Card>
      </Stack>
    </ErpShell>
  );
}
