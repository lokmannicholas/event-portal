'use client';

import { useState } from 'react';

export function CopyUrlButton(props: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(props.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-outline-secondary portal-copy-icon-button"
      onClick={handleClick}
      aria-label={props.label ?? 'Copy URL'}
      title={copied ? 'Copied' : props.label ?? 'Copy URL'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 9h10v12H9z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M5 3h10v12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
