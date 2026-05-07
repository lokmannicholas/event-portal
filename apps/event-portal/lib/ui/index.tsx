import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import {
  buildPaginationHref,
  getPaginationWindow,
  PAGE_SIZE_OPTIONS,
  type PaginationSearchParams,
  type PaginationState,
} from '../pagination';
import { PortalSidebarNav, PortalSidebarOverlay, PortalSidebarToggle } from './portal-shell-client';
import type { NavItem } from './types';

export type { NavItem } from './types';

export function PortalShell(props: {
  portal: string;
  title: string;
  subtitle?: string;
  nav: NavItem[];
  portalKind?: 'admin' | 'client' | 'registration';
  brandImageSrc?: string;
  brandImageAlt?: string;
  headerCaption?: string;
  children?: ReactNode;
  asideNote?: ReactNode;
  headerNote?: ReactNode;
  headerActions?: ReactNode;
  hideAside?: boolean;
  publicSectionLabel?: string;
  publicNavAriaLabel?: string;
}) {
  const {
    portal,
    title,
    subtitle,
    nav,
    portalKind = 'admin',
    brandImageSrc,
    brandImageAlt,
    headerCaption,
    children,
    asideNote,
    headerNote,
    headerActions,
    hideAside,
    publicSectionLabel = 'ERP Public Portal',
    publicNavAriaLabel = 'Portal navigation',
  } = props;
  const portalCode = resolvePortalCode(portal);
  const landingHref = findFirstHref(nav) ?? '/';
  const headerSummary = headerCaption ?? 'Event Portal workspace';
  const brandMark = (
    <span className={`portal-brand-mark${brandImageSrc ? ' is-image' : ''}`}>
      {brandImageSrc ? <img src={brandImageSrc} alt={brandImageAlt ?? `${portalCode} logo`} /> : <span className="portal-brand-glyph" aria-hidden="true" />}
    </span>
  );

  if (hideAside) {
    return (
      <div className="portal-shell portal-shell-auth" data-portal-kind={portalKind}>
        <div className="auth-main">
          <div className="auth-wrapper">
            <div className="auth-form">
              <div className="auth-bg">
                <span className="auth-orb auth-orb-primary auth-orb-top" />
                <span className="auth-orb auth-orb-secondary auth-orb-right" />
                <span className="auth-orb auth-orb-primary auth-orb-bottom" />
              </div>
              <div className="portal-auth-shell">
                <Link href={landingHref} className="portal-brand portal-brand-auth">
                  {brandMark}
                  <span className="portal-brand-copy">
                    <strong>{portalCode}</strong>
                    <span>{portal}</span>
                  </span>
                </Link>
                <div className="portal-auth-header">
                  <div className="portal-section-label">Secure Access</div>
                  <h1>{title}</h1>
                  {subtitle ? <p>{subtitle}</p> : null}
                </div>
                <div className="portal-auth-content">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (portalKind === 'registration') {
    const publicNavItems = flattenNavItems(nav);

    return (
      <div className="portal-shell portal-shell-registration-public" data-portal-kind={portalKind}>
        <div className="erp-public-shell">
          <header className="erp-public-hero">
            <div className="erp-public-hero-copy">
              <div className="erp-public-hero-top">
                <div className="portal-section-label">{publicSectionLabel}</div>
                {headerActions}
              </div>
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
              {publicNavItems.length > 0 ? (
                <nav className="erp-public-nav" aria-label={publicNavAriaLabel}>
                  {publicNavItems.map((item) => (
                    <Link key={`${item.href}-${item.label}`} href={item.href} className="erp-public-nav-link">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>

            <div className="erp-public-hero-side">
              <Link href={landingHref} className="erp-public-brand">
                {brandMark}
                <span className="erp-public-brand-copy">
                  <strong>{headerSummary}</strong>
                  <span>{portal}</span>
                </span>
              </Link>
              {asideNote ? <div className="erp-public-aside-note">{asideNote}</div> : null}
            </div>
          </header>

          <main className="erp-public-main">
            {headerNote ? <div className="erp-public-header-note">{headerNote}</div> : null}
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell" data-portal-kind={portalKind}>
      <aside className="pc-sidebar">
        <div className="navbar-wrapper">
          <div className="m-header">
            <Link href={landingHref} className="portal-brand">
              {brandMark}
              <span className="portal-brand-copy">
                <strong>{portalCode}</strong>
                <span>{portal}</span>
              </span>
            </Link>
          </div>

          <div className="navbar-content">
            {nav.length > 0 ? <PortalSidebarNav items={nav} /> : null}
            {asideNote ? <div className="portal-sidebar-footer">{asideNote}</div> : null}
          </div>
        </div>
      </aside>

      <header className="pc-header">
        <div className="header-wrapper">
          <div className="portal-header-left">
            <PortalSidebarToggle />
            <div>
              <div className="portal-header-label">{portal}</div>
              <div className="portal-header-caption">{headerSummary}</div>
            </div>
          </div>
          <div className="portal-header-right">
            {headerActions}
            {headerNote}
            <div className="portal-header-pill">{portalCode}</div>
          </div>
        </div>
      </header>

      <div className="pc-container">
        <div className="pc-content">
          <div className="page-header">
            <div className="page-header-surface">
              <div className="page-block">
                <div className="page-header-title">
                  <div className="portal-section-label">{portalCode}</div>
                  <h1>{title}</h1>
                  {subtitle ? <p>{subtitle}</p> : null}
                </div>
                <div className="page-header-meta">
                  <div className={`page-header-brand${brandImageSrc ? ' is-image' : ''}`}>
                    {brandImageSrc ? <img src={brandImageSrc} alt={brandImageAlt ?? `${portalCode} logo`} /> : <span>{portalCode}</span>}
                  </div>
                  <div className="page-header-meta-copy">
                    <span>{headerSummary}</span>
                    <strong>{portal}</strong>
                  </div>
                </div>
              </div>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href={landingHref}>Home</Link>
                </li>
                <li className="breadcrumb-item">{title}</li>
              </ul>
            </div>
          </div>
          {children}
        </div>
      </div>

      <PortalSidebarOverlay />
    </div>
  );
}

export function Card(props: { title?: string; description?: string; children?: ReactNode; footer?: ReactNode }) {
  return (
    <section className="card">
      {props.title || props.description ? (
        <div className="card-header">
          {props.title ? <h3>{props.title}</h3> : null}
          {props.description ? <p>{props.description}</p> : null}
        </div>
      ) : null}
      <div className="card-body">{props.children}</div>
      {props.footer ? <div className="card-footer">{props.footer}</div> : null}
    </section>
  );
}

export function StatGrid(props: { items: Array<{ label: string; value: string; helper?: string }> }) {
  return (
    <div className="portal-stat-grid">
      {props.items.map((item) => (
        <div key={item.label} className="portal-stat-card">
          <div className="portal-stat-label">{item.label}</div>
          <div className="portal-stat-value">{item.value}</div>
          {item.helper ? <div className="portal-stat-helper">{item.helper}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge(props: { value: string; label?: string }) {
  const variant = resolveVariant(props.value);

  return (
    <span className="portal-status-badge" data-status-variant={variant}>
      {props.label ?? props.value}
    </span>
  );
}

function resolveVariant(value: string): 'success' | 'warning' | 'danger' | 'info' {
  const normalized = value.toUpperCase();
  if (normalized.includes('ACTIVE') || normalized.includes('CONFIRMED')) {
    return 'success';
  }
  if (normalized.includes('DISABLED') || normalized.includes('CANCELLED') || normalized.includes('CLOSED')) {
    return 'danger';
  }
  if (normalized.includes('RELEASED') || normalized.includes('DRAFT')) {
    return 'warning';
  }
  return 'info';
}

export function SimpleTable(props: {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, ReactNode>>;
}) {
  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            {props.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {props.columns.map((column) => (
                <td key={column.key}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SplitGrid(props: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="portal-split-grid">
      <div>{props.left}</div>
      <div>{props.right}</div>
    </div>
  );
}

export function Stack(props: { gap?: number; children?: ReactNode }) {
  return <div className="portal-stack" style={{ '--stack-gap': `${props.gap ?? 18}px` } as CSSProperties}>{props.children}</div>;
}

export function KeyValueList(props: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="portal-key-value-list">
      {props.items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InlineNotice(props: { title: string; children?: ReactNode }) {
  return (
    <div className="alert alert-info portal-inline-notice">
      <div className="portal-inline-notice-title">{props.title}</div>
      <div>{props.children}</div>
    </div>
  );
}

export function EmptyState(props: { title: string; description: string }) {
  return (
    <div className="card portal-empty-state">
      <div className="card-body">
        <div className="portal-empty-state-title">{props.title}</div>
        <div className="portal-empty-state-description">{props.description}</div>
      </div>
    </div>
  );
}

export function PaginationControls(props: {
  basePath: string;
  searchParams?: PaginationSearchParams;
  pagination: PaginationState<unknown>;
  itemLabel?: string;
}) {
  const { basePath, searchParams, pagination, itemLabel = 'records' } = props;
  const windowItems = getPaginationWindow(pagination.page, pagination.totalPages);
  const preservedEntries = Object.entries(searchParams ?? {}).flatMap(([key, value]) => {
    if (key === 'page' || key === 'pageSize' || value === undefined) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((entry) => ({ key, value: entry }));
    }

    return [{ key, value }];
  });

  return (
    <div className="portal-pagination">
      <div className="portal-pagination-meta">
        <div className="portal-pagination-summary">
          {pagination.totalItems === 0
            ? `No ${itemLabel}.`
            : `Showing ${pagination.startItem}-${pagination.endItem} of ${pagination.totalItems} ${itemLabel}.`}
        </div>
        <form action={basePath} method="get" className="portal-pagination-size-form">
          {preservedEntries.map((entry, index) => (
            <input key={`${entry.key}-${entry.value}-${index}`} type="hidden" name={entry.key} value={entry.value} />
          ))}
          <label className="portal-pagination-size-label">
            <span>Page size</span>
            <select name="pageSize" defaultValue={String(pagination.pageSize)} className="portal-pagination-size-select">
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-outline-secondary portal-pagination-size-button">
            Apply
          </button>
        </form>
      </div>
      {pagination.totalPages > 1 ? (
        <nav className="portal-pagination-links" aria-label="Pagination">
          {pagination.page > 1 ? (
            <Link href={buildPaginationHref(basePath, searchParams, 1)} className="portal-pagination-link">
              First
            </Link>
          ) : (
            <span className="portal-pagination-link is-disabled" aria-disabled="true">
              First
            </span>
          )}

          {pagination.page > 1 ? (
            <Link
              href={buildPaginationHref(basePath, searchParams, pagination.page - 1)}
              className="portal-pagination-link"
            >
              Previous
            </Link>
          ) : (
            <span className="portal-pagination-link is-disabled" aria-disabled="true">
              Previous
            </span>
          )}

          <div className="portal-pagination-pages">
            {windowItems.map((item, index) =>
              typeof item === 'number' ? (
                item === pagination.page ? (
                  <span key={item} className="portal-pagination-link is-active" aria-current="page">
                    {item}
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={buildPaginationHref(basePath, searchParams, item)}
                    className="portal-pagination-link"
                  >
                    {item}
                  </Link>
                )
              ) : (
                <span key={`${item}-${index}`} className="portal-pagination-ellipsis" aria-hidden="true">
                  …
                </span>
              ),
            )}
          </div>

          {pagination.page < pagination.totalPages ? (
            <Link
              href={buildPaginationHref(basePath, searchParams, pagination.page + 1)}
              className="portal-pagination-link"
            >
              Next
            </Link>
          ) : (
            <span className="portal-pagination-link is-disabled" aria-disabled="true">
              Next
            </span>
          )}

          {pagination.page < pagination.totalPages ? (
            <Link href={buildPaginationHref(basePath, searchParams, pagination.totalPages)} className="portal-pagination-link">
              Last
            </Link>
          ) : (
            <span className="portal-pagination-link is-disabled" aria-disabled="true">
              Last
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}

function resolvePortalCode(portal: string) {
  const matched = portal.match(/\(([^)]+)\)/);
  if (matched?.[1]) {
    return matched[1];
  }

  return portal
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

function findFirstHref(items: NavItem[]): string | undefined {
  for (const item of items) {
    if (item.href) {
      return item.href;
    }

    if (item.items?.length) {
      const childHref = findFirstHref(item.items);
      if (childHref) {
        return childHref;
      }
    }
  }

  return undefined;
}

function flattenNavItems(items: NavItem[]): Array<{ href: string; label: string }> {
  return items.flatMap((item) => {
    if (item.href) {
      return [{ href: item.href, label: item.label }];
    }

    if (item.items?.length) {
      return flattenNavItems(item.items);
    }

    return [];
  });
}
