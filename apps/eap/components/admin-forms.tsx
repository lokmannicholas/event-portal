import Link from 'next/link';
import type { ReactNode } from 'react';
import { InlineNotice } from '@flu-vax/ui';
import { getNoticeContent } from '../lib/eap-records';
import { ChipMultiSelectField } from './chip-multi-select-field';

export function ActionRow(props: { children?: ReactNode }) {
  return <div className="portal-action-row">{props.children}</div>;
}

export function ActionLink(props: { href: string; label: string; variant?: 'primary' | 'secondary' }) {
  return (
    <Link href={props.href} className={`btn ${props.variant === 'secondary' ? 'btn-outline-secondary' : 'btn-primary'}`}>
      {props.label}
    </Link>
  );
}

export function NoticeBanner(props: { code?: string; title?: string; description?: string }) {
  const notice = getNoticeContent(props.code);

  if (props.code && (props.title || props.description)) {
    return <InlineNotice title={props.title ?? notice?.title ?? 'Notice'}>{props.description ?? notice?.description}</InlineNotice>;
  }

  if (!notice) {
    return null;
  }

  return <InlineNotice title={notice.title}>{notice.description}</InlineNotice>;
}

export function FormGrid(props: { children?: ReactNode }) {
  return <div className="portal-form-grid">{props.children}</div>;
}

export function Field(props: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="portal-field">
      <span className="portal-field-label">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? 'text'}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        required={props.required}
      />
    </label>
  );
}

export function TextAreaField(props: { label: string; name: string; defaultValue?: string; rows?: number; placeholder?: string }) {
  return (
    <label className="portal-field-full">
      <span className="portal-field-label">{props.label}</span>
      <textarea
        name={props.name}
        defaultValue={props.defaultValue}
        rows={props.rows ?? 4}
        placeholder={props.placeholder}
      />
    </label>
  );
}

export function FileField(props: {
  label: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  helperText?: string;
}) {
  return (
    <label className="portal-field-full">
      <span className="portal-field-label">{props.label}</span>
      <input name={props.name} type="file" accept={props.accept} multiple={props.multiple} />
      {props.helperText ? <p className="portal-helper-text">{props.helperText}</p> : null}
    </label>
  );
}

export function SelectField(props: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="portal-field">
      <span className="portal-field-label">{props.label}</span>
      <select name={props.name} defaultValue={props.defaultValue} required={props.required}>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MultiSelectField(props: {
  label: string;
  name: string;
  defaultValue?: string[];
  options: Array<{ value: string; label: string }>;
  size?: number;
}) {
  return (
    <label className="portal-field-full">
      <span className="portal-field-label">{props.label}</span>
      <select
        name={props.name}
        multiple
        defaultValue={props.defaultValue}
        size={props.size ?? Math.min(Math.max(props.options.length, 3), 8)}
        style={{ minHeight: '120px' }}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export { ChipMultiSelectField };

export function SubmitRow(props: { submitLabel: string; cancelHref: string; cancelLabel?: string }) {
  return (
    <ActionRow>
      <button type="submit" className="btn btn-primary">
        {props.submitLabel}
      </button>
      <ActionLink href={props.cancelHref} label={props.cancelLabel ?? 'Back'} variant="secondary" />
    </ActionRow>
  );
}
