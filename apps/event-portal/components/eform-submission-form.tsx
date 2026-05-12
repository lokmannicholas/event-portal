'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormFieldConfigDTO, EformDetailDTO } from '@event-portal/contracts';
import { createErpEformSubmission } from '../lib/erp-api';
import {
  getLocalizedEformDescription,
  getLocalizedEformName,
  getLocalizedEformNotes,
  getLocalizedFieldLabel,
  getLocalizedFieldPlaceholder,
  isTraditionalChinese,
  type ErpLanguage,
} from '../lib/erp-language';
import { resolveTemplateLayoutSettings } from '../lib/template-layout';

type StatusTone = 'info' | 'success' | 'danger';

function getThemeStyles(colors: {
  pageBackground?: string;
  surfaceBackground?: string;
  surfaceBorderColor?: string;
  accentColor?: string;
  headingColor?: string;
  bodyTextColor?: string;
  fieldBackground?: string;
  fieldBorderColor?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
}) {
  return {
    flow: {
      background: colors.pageBackground,
      color: colors.bodyTextColor,
    },
    surface: {
      background: colors.surfaceBackground,
      borderColor: colors.surfaceBorderColor,
      color: colors.bodyTextColor,
    },
    heading: {
      color: colors.headingColor,
    },
    accent: {
      color: colors.accentColor,
    },
    field: {
      background: colors.fieldBackground,
      borderColor: colors.fieldBorderColor,
      color: colors.bodyTextColor,
    },
    primaryButton: {
      background: colors.buttonBackground,
      borderColor: colors.buttonBackground,
      color: colors.buttonTextColor,
    },
  } as const;
}

export function EformSubmissionForm(props: { detail: EformDetailDTO; language: ErpLanguage }) {
  const isZh = isTraditionalChinese(props.language);
  const eformName = getLocalizedEformName(props.detail.eform, props.language);
  const overviewText = getLocalizedEformNotes(props.detail.eform, props.language) || getLocalizedEformDescription(props.detail.eform, props.language);
  const copy = {
    kicker: isZh ? '電子表格' : 'E-Form',
    title: isZh ? '填寫表格' : 'Complete form',
    description:
      overviewText || (isZh ? '請填寫以下資料並提交表格。' : 'Complete the requested information below and submit the form.'),
    summaryTitle: isZh ? '表格資料' : 'Form details',
    eventWindowLabel: isZh ? '有效日期' : 'Active window',
    selectPlaceholder: isZh ? '請選擇' : 'Please select',
    termsText: isZh ? '本人確認以上資料正確，並同意提交此電子表格。' : 'I confirm the information above is accurate and agree to submit this e-form.',
    submit: isZh ? '提交表格' : 'Submit form',
    submitting: isZh ? '提交中...' : 'Submitting...',
    successTitle: isZh ? '表格已提交' : 'Form submitted',
    successDescription: isZh ? '請保留以下提交編號作日後跟進。' : 'Keep the submission reference below for future follow-up.',
    submissionReference: isZh ? '提交編號' : 'Submission reference',
    acceptTerms: isZh ? '提交前請先確認條款。' : 'Please confirm the submission terms before continuing.',
    submitFailure: isZh ? '暫時未能提交表格，請稍後再試。' : 'Unable to submit the form right now. Please try again later.',
    submitSuccess: isZh ? '電子表格已成功提交。' : 'The e-form was submitted successfully.',
  };
  const registerFields = useMemo(
    () =>
      props.detail.eform.fields
        .filter((field) => field.visibleInERP)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [props.detail.eform.fields],
  );
  const resolvedLayout = useMemo(
    () => resolveTemplateLayoutSettings(registerFields.map((field) => field.fieldKey), props.detail.eform.layoutSettings),
    [props.detail.eform.layoutSettings, registerFields],
  );
  const themeStyles = getThemeStyles(resolvedLayout.colors);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [submittedReference, setSubmittedReference] = useState('');
  const fieldByKey = new Map(registerFields.map((field) => [field.fieldKey, field]));
  const leftColumnFields = resolvedLayout.fieldPositions
    .filter((position) => position.column === 'left')
    .map((position) => fieldByKey.get(position.fieldKey))
    .filter((field): field is FormFieldConfigDTO => Boolean(field));
  const rightColumnFields = resolvedLayout.fieldPositions
    .filter((position) => position.column === 'right')
    .map((position) => fieldByKey.get(position.fieldKey))
    .filter((field): field is FormFieldConfigDTO => Boolean(field));
  const fullWidthFields = resolvedLayout.fieldPositions
    .filter((position) => position.column === 'full')
    .map((position) => fieldByKey.get(position.fieldKey))
    .filter((field): field is FormFieldConfigDTO => Boolean(field));
  const stackedFields = leftColumnFields.length > 0 && rightColumnFields.length > 0 ? [] : [...leftColumnFields, ...rightColumnFields];

  useEffect(() => {
    setFieldValues(Object.fromEntries(registerFields.map((field) => [field.fieldKey, ''])));
  }, [registerFields]);

  function getFieldValue(fieldKey: string) {
    return fieldValues[fieldKey] ?? '';
  }

  function setFieldValue(fieldKey: string, value: string) {
    setFieldValues((current) => ({ ...current, [fieldKey]: value }));
  }

  function toggleCheckboxValue(fieldKey: string, option: string, checked: boolean) {
    const currentValues = (fieldValues[fieldKey] ?? '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);
    const nextValues = checked ? Array.from(new Set([...currentValues, option])) : currentValues.filter((value) => value !== option);
    setFieldValue(fieldKey, nextValues.join('|'));
  }

  function getCheckboxValues(fieldKey: string) {
    return (fieldValues[fieldKey] ?? '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function renderFieldInput(field: FormFieldConfigDTO) {
    if (field.fieldType === 'TEXTAREA') {
      return (
        <textarea
          value={getFieldValue(field.fieldKey)}
          onChange={(event) => setFieldValue(field.fieldKey, event.target.value)}
          required={field.required}
          placeholder={getLocalizedFieldPlaceholder(field, props.language)}
          rows={4}
          style={themeStyles.field}
        />
      );
    }

    if (field.fieldType === 'CHECKBOX') {
      if (field.options && field.options.length > 0) {
        return (
          <div className="erp-booking-choice-list">
            {field.options.map((option) => {
              const checked = getCheckboxValues(field.fieldKey).includes(option);

              return (
                <label key={option} className="erp-booking-choice-item" style={themeStyles.field}>
                  <input type="checkbox" checked={checked} onChange={(event) => toggleCheckboxValue(field.fieldKey, option, event.target.checked)} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        );
      }

      return (
        <label className="erp-booking-choice-item" style={themeStyles.field}>
          <input
            type="checkbox"
            checked={getFieldValue(field.fieldKey) === 'true'}
            onChange={(event) => setFieldValue(field.fieldKey, event.target.checked ? 'true' : '')}
          />
          <span>{getLocalizedFieldLabel(field, props.language)}</span>
        </label>
      );
    }

    if (field.fieldType === 'RADIO') {
      return (
        <div className="erp-booking-choice-list">
          {(field.options ?? []).map((option) => (
            <label key={option} className="erp-booking-choice-item" style={themeStyles.field}>
              <input
                type="radio"
                name={field.fieldKey}
                value={option}
                checked={getFieldValue(field.fieldKey) === option}
                onChange={(event) => setFieldValue(field.fieldKey, event.target.value)}
                required={field.required}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.fieldType === 'SELECT') {
      return (
        <select
          value={getFieldValue(field.fieldKey)}
          onChange={(event) => setFieldValue(field.fieldKey, event.target.value)}
          required={field.required}
          style={themeStyles.field}
        >
          <option value="">{copy.selectPlaceholder}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={
          field.fieldType === 'EMAIL'
            ? 'email'
            : field.fieldType === 'NUMBER'
              ? 'number'
              : field.fieldType === 'DATE'
                ? 'date'
                : field.fieldType === 'MOBILE'
                  ? 'tel'
                  : 'text'
        }
        value={getFieldValue(field.fieldKey)}
        onChange={(event) => setFieldValue(field.fieldKey, event.target.value)}
        required={field.required}
        placeholder={getLocalizedFieldPlaceholder(field, props.language)}
        style={themeStyles.field}
      />
    );
  }

  function renderFieldCard(field: FormFieldConfigDTO) {
    return (
      <div key={field.fieldKey} className="erp-booking-field" style={themeStyles.surface}>
        <div className="erp-booking-field-label" style={themeStyles.heading}>
          {getLocalizedFieldLabel(field, props.language)}
          {field.required ? <span>*</span> : null}
        </div>
        {renderFieldInput(field)}
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!termsAccepted) {
      setStatus({ tone: 'danger', text: copy.acceptTerms });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await createErpEformSubmission({
        eformDocumentId: props.detail.eform.documentId,
        partitionCode: props.detail.eform.partitionCode,
        termsAccepted,
        formValues: fieldValues,
      });

      setSubmittedReference(String(response.submissionReference ?? ''));
      setStatus({ tone: 'success', text: copy.submitSuccess });
    } catch {
      setStatus({ tone: 'danger', text: copy.submitFailure });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedReference) {
    return (
      <div className="erp-booking-flow" style={themeStyles.flow}>
        {props.detail.eform.customCss ? <style>{props.detail.eform.customCss}</style> : null}
        <section className="erp-booking-banner" style={themeStyles.surface}>
          <div className="erp-booking-banner-copy">
            <span className="erp-booking-kicker" style={themeStyles.accent}>{copy.kicker}</span>
            <h2 style={themeStyles.heading}>{copy.successTitle}</h2>
            <p>{copy.successDescription}</p>
          </div>
          <div className="erp-booking-summary-grid">
            <div className="erp-booking-summary-card is-highlighted" style={themeStyles.surface}>
              <span>{copy.submissionReference}</span>
              <strong style={themeStyles.heading}>{submittedReference}</strong>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="erp-booking-flow" style={themeStyles.flow}>
      {props.detail.eform.customCss ? <style>{props.detail.eform.customCss}</style> : null}

      <section className="erp-booking-banner" style={themeStyles.surface}>
        <div className="erp-booking-banner-copy">
          <span className="erp-booking-kicker" style={themeStyles.accent}>{copy.kicker}</span>
          <h2 style={themeStyles.heading}>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="erp-booking-summary-grid">
          <div className="erp-booking-summary-card" style={themeStyles.surface}>
            <span>{copy.eventWindowLabel}</span>
            <strong style={themeStyles.heading}>
              {props.detail.eform.eventStartDate} - {props.detail.eform.eventEndDate}
            </strong>
          </div>
        </div>
      </section>

      <section className="erp-booking-shell" style={themeStyles.surface}>
        <div className="erp-booking-shell-heading">
          <div>
            <span className="erp-booking-shell-kicker" style={themeStyles.accent}>{copy.kicker}</span>
            <h3 style={themeStyles.heading}>{copy.summaryTitle}</h3>
          </div>
        </div>

        {status ? (
          <div className={`erp-booking-status is-${status.tone}`}>
            <span className="erp-booking-status-dot" aria-hidden="true" />
            <span>{status.text}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="erp-booking-form">
          <div className={`erp-booking-fields-layout${leftColumnFields.length > 0 && rightColumnFields.length > 0 ? ' is-two-column' : ''}`}>
            {leftColumnFields.length > 0 && rightColumnFields.length > 0 ? (
              <>
                <div className="erp-booking-fields-column">{leftColumnFields.map((field) => renderFieldCard(field))}</div>
                <div className="erp-booking-fields-column">{rightColumnFields.map((field) => renderFieldCard(field))}</div>
              </>
            ) : (
              <div className="erp-booking-fields-column">{stackedFields.map((field) => renderFieldCard(field))}</div>
            )}

            {fullWidthFields.length > 0 ? (
              <div className="erp-booking-fields-column is-full">{fullWidthFields.map((field) => renderFieldCard(field))}</div>
            ) : null}
          </div>

          <label className="erp-booking-terms">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
            <span>{copy.termsText}</span>
          </label>

          <div className="erp-booking-actions">
            <button type="submit" disabled={isSubmitting} className="erp-booking-button is-primary" style={themeStyles.primaryButton}>
              {isSubmitting ? copy.submitting : copy.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
