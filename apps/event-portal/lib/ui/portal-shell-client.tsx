'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { NavItem } from './types';

const SIDEBAR_ATTR = 'data-portal-sidebar-open';

function isSidebarOpen() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.body.getAttribute(SIDEBAR_ATTR) === 'true';
}

function setSidebarOpen(open: boolean) {
  if (typeof document === 'undefined') {
    return;
  }

  if (open) {
    document.body.setAttribute(SIDEBAR_ATTR, 'true');
    return;
  }

  document.body.removeAttribute(SIDEBAR_ATTR);
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.href) {
    if (item.href === '/') {
      return pathname === '/';
    }

    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return true;
    }
  }

  return item.items?.some((child) => isItemActive(pathname, child)) ?? false;
}

function renderNavItem(item: NavItem, pathname: string, depth = 0): ReactNode {
  const key = item.href ?? `${depth}-${item.label}`;
  const active = isItemActive(pathname, item);

  if (item.items?.length) {
    if (depth === 0) {
      return (
        <div key={key} className="pc-nav-group">
          <div className="pc-caption">{item.label}</div>
          <div className="pc-submenu-root">{item.items.map((child) => renderNavItem(child, pathname, depth + 1))}</div>
        </div>
      );
    }

    return (
      <div key={key} className={`pc-item pc-has-submenu${active ? ' active' : ''}`}>
        <div className="pc-link pc-link-heading">{item.label}</div>
        <div className="pc-submenu">{item.items.map((child) => renderNavItem(child, pathname, depth + 1))}</div>
      </div>
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <div key={key} className={`pc-item${active ? ' active' : ''}`}>
      <Link href={item.href} className="pc-link" aria-current={active ? 'page' : undefined}>
        <span className="pc-link-marker" aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    </div>
  );
}

export function PortalSidebarNav(props: { items: NavItem[] }) {
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return <nav className="pc-navbar">{props.items.map((item) => renderNavItem(item, pathname))}</nav>;
}

export function PortalSidebarToggle() {
  return (
    <button
      type="button"
      className="pc-head-link portal-toggle-button"
      aria-label="Toggle navigation"
      onClick={() => setSidebarOpen(!isSidebarOpen())}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

export function PortalSidebarOverlay() {
  return <button type="button" className="pc-menu-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />;
}

export function PortalLanguageSwitcher(props: {
  queryParamName?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryParamName = props.queryParamName ?? 'lang';

  return (
    <div className="portal-language-switcher" role="group" aria-label={props.ariaLabel}>
      {props.options.map((option) => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set(queryParamName, option.value);
        const href = `${pathname}?${params.toString()}`;
        const active = option.value === props.value;

        return (
          <Link
            key={option.value}
            href={href}
            className={`portal-language-switcher-button${active ? ' is-active' : ''}`}
            aria-current={active ? 'true' : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
