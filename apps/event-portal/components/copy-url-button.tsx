'use client';

import { useState } from 'react';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';

export function CopyUrlButton(props: { value: string; label?: string; language?: PortalLanguage }) {
  const [copied, setCopied] = useState(false);
  const language = props.language ?? 'en';
  const defaultLabel = getPortalText(language, 'Copy URL', '複製連結');
  const copiedLabel = getPortalText(language, 'Copied', '已複製');
  const buttonLabel = props.label ?? defaultLabel;

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
      aria-label={buttonLabel}
      title={copied ? copiedLabel : buttonLabel}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 9h10v12H9z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M5 3h10v12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span>{copied ? copiedLabel : getPortalText(language, 'Copy', '複製')}</span>
    </button>
  );
}
