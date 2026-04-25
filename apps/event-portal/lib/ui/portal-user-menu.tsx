'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

export function PortalUserMenu(props: {
  username: string;
  email: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="portal-user-menu-shell">
      <button
        type="button"
        className="pc-head-link portal-account-trigger"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12.75a4.5 4.5 0 1 0-4.5-4.5 4.5 4.5 0 0 0 4.5 4.5Zm0 2.25c-3.79 0-6.75 2.34-6.75 5.25a.75.75 0 0 0 1.5 0c0-1.82 2.18-3.75 5.25-3.75s5.25 1.93 5.25 3.75a.75.75 0 0 0 1.5 0c0-2.91-2.96-5.25-6.75-5.25Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open ? (
        <div className="portal-user-card portal-user-card-dropdown" role="menu">
          <div className="portal-user-card-summary">
            <div className="portal-user-avatar" aria-hidden="true">
              {props.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="portal-user-title">{props.username}</div>
              <div className="portal-user-meta">{props.email}</div>
            </div>
          </div>
          <div className="portal-user-menu">{props.children}</div>
        </div>
      ) : null}
    </div>
  );
}
