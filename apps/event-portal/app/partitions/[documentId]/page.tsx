import { Card, EmptyState, KeyValueList, SplitGrid, Stack, StatusBadge } from '@event-portal/ui';
import { updateRecordAction } from '../../actions/eap-record-actions';
import { ActionLink, ActionRow, Field, FileField, FormGrid, NoticeBanner, SelectField, SubmitRow, TextAreaField } from '../../../components/admin-forms';
import { ErpPathSummary } from '../../../components/erp-path-summary';
import { EapShell } from '../../../components/eap-shell';
import { getGroups, getPartition } from '../../../lib/api';
import type { NoticeQuery } from '../../../lib/eap-records';
import { getAppBaseUrl } from '../../../lib/app-base-url';
import { toAbsoluteStrapiMediaUrl } from '../../../lib/strapi-media';

type PageProps = {
  params: Promise<{ documentId: string }>;
  searchParams?: Promise<NoticeQuery>;
};

function hasResolvedMediaUrl<T extends { url?: string }>(value: T): value is T & { url: string } {
  return typeof value.url === 'string' && value.url.length > 0;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ documentId }, query] = await Promise.all([params, searchParams]);
  const [record, groupRows, appBaseUrl] = await Promise.all([getPartition(documentId), getGroups(), getAppBaseUrl()]);

  if (!record) {
    return (
      <EapShell title="Partition Detail" subtitle="The requested partition record could not be found.">
        <Stack>
          <ActionRow>
            <ActionLink href="/partitions" label="Back to User Partition" variant="secondary" />
          </ActionRow>
          <EmptyState title="Partition not found" description="Check the selected record id or create a new partition." />
        </Stack>
      </EapShell>
    );
  }

  const erpUrl = `${appBaseUrl}/p/${record.code}`;
  const logoUrl = toAbsoluteStrapiMediaUrl(record.logo?.url);
  const bannerUrls = record.banners
    .map((banner) => ({
      ...banner,
      url: toAbsoluteStrapiMediaUrl(banner.url),
    }))
    .filter(hasResolvedMediaUrl);

  return (
    <EapShell title={record.code} subtitle="Update partition scope, ERP path slug, and linked group metadata from the record detail page.">
      <Stack>
        <ActionRow>
          <ActionLink href="/partitions" label="Back to User Partition" variant="secondary" />
          <ActionLink href="/partitions/new" label="Create partition" />
        </ActionRow>
        <NoticeBanner code={query?.notice} title={query?.title} description={query?.message} />

        <SplitGrid
          left={
            <Card title="Partition detail" description="Changes here update the partition record directly.">
              <form action={updateRecordAction.bind(null, 'partition', record.documentId)} encType="multipart/form-data">
                <Stack gap={16}>
                  <FormGrid>
                    <Field label="Partition code" name="code" defaultValue={record.code} required />
                    <Field label="Description" name="description" defaultValue={record.description} required />
                    <Field label="Slug" name="slug" defaultValue={record.slug} required />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={record.status}
                      options={[
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'DISABLED', label: 'DISABLED' },
                      ]}
                    />
                    <SelectField
                      label="Owning group"
                      name="userGroupDocumentId"
                      defaultValue={record.userGroupDocumentIds?.[0] ?? ''}
                      options={[{ value: '', label: 'Unassigned' }, ...groupRows.map((item) => ({ value: item.documentId, label: `${item.code} · ${item.description}` }))]}
                    />
                  </FormGrid>

                  <FileField
                    label="Logo"
                    name="logo"
                    accept="image/*"
                    helperText="Upload a replacement logo for the ERP landing page."
                  />
                  <FileField
                    label="Banners"
                    name="banners"
                    accept="image/*"
                    multiple
                    helperText="Uploading banner images replaces the current banner set in ERP."
                  />
                  <TextAreaField label="Remarks" name="remarks" defaultValue={record.remarks} rows={3} />

                  <SubmitRow submitLabel="Update partition" cancelHref="/partitions" cancelLabel="Back to list" />
                </Stack>
              </form>
            </Card>
          }
          right={
            <Card title="Partition summary" description="Current public access information for this partition.">
              <Stack gap={16}>
                <KeyValueList
                  items={[
                    { label: 'Status', value: <StatusBadge value={record.status} /> },
                    { label: 'ERP path', value: <ErpPathSummary url={erpUrl} /> },
                    { label: 'Slug', value: record.slug },
                    { label: 'Owning group', value: record.userGroupCodes[0] ?? '-' },
                  ]}
                />

                {logoUrl || bannerUrls.length > 0 ? (
                  <div className="portal-branding-preview">
                    {logoUrl ? (
                      <div className="portal-branding-logo">
                        <span className="portal-field-label">Logo</span>
                        <img src={logoUrl} alt={record.logo?.alternativeText ?? `${record.code} logo`} />
                      </div>
                    ) : null}
                    {bannerUrls.length > 0 ? (
                      <div className="portal-branding-banners">
                        <span className="portal-field-label">Banners</span>
                        <div className="portal-branding-banner-grid">
                          {bannerUrls.map((banner) => (
                            <img key={banner.documentId ?? banner.url} src={banner.url} alt={banner.alternativeText ?? banner.name} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="portal-empty-box">No logo or banner is currently configured for this partition.</div>
                )}
              </Stack>
            </Card>
          }
        />
      </Stack>
    </EapShell>
  );
}
