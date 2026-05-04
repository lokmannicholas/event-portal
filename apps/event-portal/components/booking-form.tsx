'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { EventDetailDTO, FormFieldConfigDTO } from '@event-portal/contracts';
import { createErpBooking, createErpHold } from '../lib/erp-api';

type SlotOption = {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  remaining: number;
};

type StatusTone = 'info' | 'warning' | 'success' | 'danger';

function formatRemaining(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDisplayDate(date: string) {
  const resolvedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(resolvedDate.getTime())) {
    return date;
  }

  return resolvedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function resolveFieldLabel(field: FormFieldConfigDTO) {
  return field.labelZh?.trim() || field.labelEn;
}

function resolveFieldPlaceholder(field: FormFieldConfigDTO) {
  return field.placeholderZh?.trim() || field.placeholderEn;
}

export function BookingForm(props: { detail: EventDetailDTO }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [holdToken, setHoldToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [status, setStatus] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string>('');
  const [isHolding, setIsHolding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registerFields = useMemo(
    () =>
      props.detail.event.fields
        .filter((field) => field.visibleInERP)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [props.detail.event.fields],
  );
  const initialFieldValues = Object.fromEntries(registerFields.map((field) => [field.fieldKey, ''])) as Record<string, string>;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialFieldValues);
  const [communicationPreference, setCommunicationPreference] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const slotGroups = useMemo(
    () =>
      props.detail.event.dates.map((date) => ({
        date: date.date,
        enabled: date.enabled,
        slots: date.slots.map((slot) => ({
          documentId: slot.documentId,
          date: date.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          enabled: date.enabled && slot.enabled && slot.remaining > 0,
          remaining: slot.remaining,
        })),
      })),
    [props.detail.event.dates],
  );
  const layoutColumns =
    props.detail.event.layoutMode === 'SPLIT'
      ? 'minmax(260px, 1.2fr) minmax(260px, 1fr)'
      : props.detail.event.layoutMode === 'SINGLE_COLUMN'
        ? '1fr'
        : 'repeat(auto-fit, minmax(220px, 1fr))';
  const detailSummaryItems = [
    { label: '活動名稱', value: props.detail.event.eventName },
    { label: '地點', value: props.detail.event.location },
    { label: '服務機構', value: props.detail.event.companyName },
    {
      label: '登記日期',
      value: `${props.detail.event.registrationStartDate} - ${props.detail.event.registrationEndDate}`,
    },
  ];
  const reviewFields = registerFields
    .map((field) => ({
      label: resolveFieldLabel(field),
      value:
        field.fieldType === 'CHECKBOX'
          ? getCheckboxValues(field.fieldKey).join(', ')
          : getFieldValue(field.fieldKey),
    }))
    .filter((item) => item.value);

  useEffect(() => {
    setFieldValues(Object.fromEntries(registerFields.map((field) => [field.fieldKey, ''])));
  }, [registerFields]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      setCountdown(diff);

      if (diff <= 0) {
        setHoldToken('');
        setExpiresAt('');
        setSelectedSlot(null);
        setCurrentStep(1);
        setStatus({ tone: 'warning', text: 'The reserved timeslot has expired. Please choose a new timeslot to continue.' });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

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

  function getMappedValue(fieldKey: string, fallback = '') {
    return getFieldValue(fieldKey) || fallback;
  }

  async function handleHold(slot: SlotOption) {
    setIsHolding(true);
    setStatus(null);

    try {
      const hold = await createErpHold({
        eventDocumentId: props.detail.event.documentId,
        eventSlotDocumentId: slot.documentId,
        partitionCode: props.detail.event.partitionCode,
      });

      setSelectedSlot(slot);
      setHoldToken(hold.holdToken);
      setExpiresAt(hold.expiresAt);
      setCountdown(Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));
      setStatus({
        tone: 'info',
        text: `Timeslot reserved temporarily until ${new Date(hold.expiresAt).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })}.`,
      });
    } catch {
      setSelectedSlot(null);
      setHoldToken('');
      setExpiresAt('');
      setCountdown(0);
      setStatus({ tone: 'danger', text: 'Unable to reserve this timeslot right now. Please try again.' });
    } finally {
      setIsHolding(false);
    }
  }

  function handleContinueFromSlot() {
    if (!selectedSlot || !holdToken) {
      setStatus({ tone: 'danger', text: 'Please choose an available timeslot before continuing.' });
      return;
    }

    setCurrentStep(2);
    setStatus(null);
  }

  function handleContinueToReview() {
    if (!selectedSlot || !holdToken) {
      setCurrentStep(1);
      setStatus({ tone: 'danger', text: 'Your timeslot selection is no longer active. Please select it again.' });
      return;
    }

    if (!formRef.current?.reportValidity()) {
      return;
    }

    setCurrentStep(3);
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot || !holdToken) {
      setCurrentStep(1);
      setStatus({ tone: 'danger', text: 'Please reserve a timeslot before submitting.' });
      return;
    }

    if (!termsAccepted) {
      setStatus({ tone: 'danger', text: 'Please acknowledge the booking terms before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const booking = await createErpBooking({
        eventDocumentId: props.detail.event.documentId,
        eventSlotDocumentId: selectedSlot.documentId,
        partitionCode: props.detail.event.partitionCode,
        holdToken,
        participantName: getMappedValue('participant_name'),
        staffNumber: getMappedValue('staff_number'),
        medicalCardNumber: getMappedValue('medical_card_number'),
        hkidPrefix: getMappedValue('hkid_prefix'),
        registeredEmail: getMappedValue('registered_email'),
        mobileNumber: getMappedValue('mobile_number'),
        communicationPreference,
        termsAccepted,
        formValues: fieldValues,
      });

      setSubmittedReference(booking.bookingReference);
      setHoldToken('');
      setExpiresAt('');
      setCountdown(0);
      setStatus({
        tone: 'success',
        text: 'Booking confirmed. A confirmation email or SMS will be sent according to the selected communication preference.',
      });
    } catch {
      setStatus({ tone: 'danger', text: 'Unable to submit your booking right now. Please try again or contact support.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedReference) {
    return (
      <div className="erp-booking-flow">
        {props.detail.event.customCss ? <style>{props.detail.event.customCss}</style> : null}

        <section className="erp-booking-banner">
          <div className="erp-booking-banner-copy">
            <span className="erp-booking-kicker">預約服務</span>
            <h2>預約已確認</h2>
            <p>請保留以下資料，以便日後查詢或改期時使用。</p>
          </div>
          <div className="erp-booking-summary-grid">
            <div className="erp-booking-summary-card is-highlighted">
              <span>Booking reference</span>
              <strong>{submittedReference}</strong>
            </div>
            <div className="erp-booking-summary-card">
              <span>Appointment</span>
              <strong>
                {selectedSlot ? `${formatDisplayDate(selectedSlot.date)} ${selectedSlot.startTime}-${selectedSlot.endTime}` : props.detail.event.eventName}
              </strong>
            </div>
            <div className="erp-booking-summary-card">
              <span>Communication</span>
              <strong>{communicationPreference === 'EMAIL' ? 'Email' : 'SMS'}</strong>
            </div>
          </div>
        </section>

        <section className="erp-booking-shell">
          {status ? (
            <div className={`erp-booking-status is-${status.tone}`}>
              <span className="erp-booking-status-dot" aria-hidden="true" />
              <span>{status.text}</span>
            </div>
          ) : null}

          <div className="erp-booking-review-grid">
            <div className="erp-booking-review-card">
              <h3>活動資料</h3>
              <dl>
                <div>
                  <dt>活動名稱</dt>
                  <dd>{props.detail.event.eventName}</dd>
                </div>
                <div>
                  <dt>地點</dt>
                  <dd>{props.detail.event.location}</dd>
                </div>
                <div>
                  <dt>已預留時段</dt>
                  <dd>{selectedSlot ? `${formatDisplayDate(selectedSlot.date)} ${selectedSlot.startTime}-${selectedSlot.endTime}` : '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="erp-booking-review-card">
              <h3>登記資料</h3>
              <dl>
                {reviewFields.map((field) => (
                  <div key={field.label}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="erp-booking-flow">
      {props.detail.event.customCss ? <style>{props.detail.event.customCss}</style> : null}

      <section className="erp-booking-banner">
        <div className="erp-booking-banner-copy">
          <span className="erp-booking-kicker">預約服務</span>
          <h2>疫苗接種預約登記</h2>
          <p>{props.detail.event.description ?? 'Select a session, complete your details, and confirm the booking in three simple steps.'}</p>
        </div>
        <div className="erp-booking-summary-grid">
          {detailSummaryItems.map((item) => (
            <div key={item.label} className="erp-booking-summary-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="erp-booking-stepper" aria-label="Booking progress">
        {[
          { index: 1, label: '選擇時段', helper: 'Select timeslot' },
          { index: 2, label: '填寫個人資料', helper: 'Personal details' },
          { index: 3, label: '確認資料', helper: 'Review & submit' },
        ].map((step) => {
          const state = currentStep === step.index ? 'active' : currentStep > step.index ? 'completed' : 'pending';

          return (
            <div key={step.index} className={`erp-booking-step is-${state}`}>
              <div className="erp-booking-step-index">{step.index}</div>
              <div className="erp-booking-step-copy">
                <strong>{step.label}</strong>
                <span>{step.helper}</span>
              </div>
            </div>
          );
        })}
      </div>

      <section className="erp-booking-shell">
        <div className="erp-booking-shell-heading">
          <div>
            <span className="erp-booking-shell-kicker">Step {currentStep}</span>
            <h3>
              {currentStep === 1
                ? '選擇日期及時段'
                : currentStep === 2
                  ? '填寫登記資料'
                  : '確認預約資料'}
            </h3>
            <p>
              {currentStep === 1
                ? 'Choose one available session to temporarily reserve your booking window.'
                : currentStep === 2
                  ? 'Enter the participant information exactly as required by the registration template.'
                  : 'Review the booking details below before final submission.'}
            </p>
          </div>
          {holdToken && selectedSlot ? (
            <div className="erp-booking-timer-card">
              <span>Reserved timeslot</span>
              <strong>{formatRemaining(countdown)}</strong>
              <small>
                {formatDisplayDate(selectedSlot.date)} {selectedSlot.startTime}-{selectedSlot.endTime}
              </small>
            </div>
          ) : null}
        </div>

        {status ? (
          <div className={`erp-booking-status is-${status.tone}`}>
            <span className="erp-booking-status-dot" aria-hidden="true" />
            <span>{status.text}</span>
          </div>
        ) : null}

        <form ref={formRef} onSubmit={handleSubmit} className="erp-booking-form">
          {currentStep === 1 ? (
            <div className="erp-booking-slot-groups">
              {slotGroups.map((group) => (
                <section key={group.date} className="erp-booking-slot-group">
                  <div className="erp-booking-slot-group-header">
                    <div>
                      <h4>{formatDisplayDate(group.date)}</h4>
                      <span>
                        {group.slots.filter((slot) => slot.enabled).length} available session
                        {group.slots.filter((slot) => slot.enabled).length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <div className="erp-booking-slot-grid">
                    {group.slots.map((slot) => {
                      const isSelected = selectedSlot?.documentId === slot.documentId;

                      return (
                        <button
                          key={slot.documentId}
                          type="button"
                          disabled={!slot.enabled || isHolding}
                          onClick={() => handleHold(slot)}
                          className={`erp-booking-slot-card${isSelected ? ' is-selected' : ''}`}
                        >
                          <div className="erp-booking-slot-time">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="erp-booking-slot-meta">
                            <span>{slot.enabled ? `${slot.remaining} quota left` : 'Unavailable'}</span>
                            <strong>{isSelected ? 'Selected' : slot.enabled ? 'Choose' : 'Closed'}</strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="erp-booking-fields-wrap">
              <div className="erp-booking-fields" style={{ gridTemplateColumns: layoutColumns }}>
                {registerFields.map((field) => (
                  <div key={field.fieldKey} className="erp-booking-field">
                    <div className="erp-booking-field-label">
                      {resolveFieldLabel(field)}
                      {field.required ? <span>*</span> : null}
                    </div>

                    {field.fieldType === 'TEXTAREA' ? (
                      <textarea
                        value={getFieldValue(field.fieldKey)}
                        onChange={(event) => setFieldValue(field.fieldKey, event.target.value)}
                        required={field.required}
                        placeholder={resolveFieldPlaceholder(field)}
                        rows={4}
                      />
                    ) : field.fieldType === 'CHECKBOX' ? (
                      field.options && field.options.length > 0 ? (
                        <div className="erp-booking-choice-list">
                          {field.options.map((option) => {
                            const checked = getCheckboxValues(field.fieldKey).includes(option);

                            return (
                              <label key={option} className="erp-booking-choice-item">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => toggleCheckboxValue(field.fieldKey, option, event.target.checked)}
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <label className="erp-booking-choice-item">
                          <input
                            type="checkbox"
                            checked={getFieldValue(field.fieldKey) === 'true'}
                            onChange={(event) => setFieldValue(field.fieldKey, event.target.checked ? 'true' : '')}
                          />
                          <span>{resolveFieldLabel(field)}</span>
                        </label>
                      )
                    ) : field.fieldType === 'RADIO' ? (
                      <div className="erp-booking-choice-list">
                        {(field.options ?? []).map((option) => (
                          <label key={option} className="erp-booking-choice-item">
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
                    ) : field.fieldType === 'SELECT' ? (
                      <select value={getFieldValue(field.fieldKey)} onChange={(event) => setFieldValue(field.fieldKey, event.target.value)} required={field.required}>
                        <option value="">Please select</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
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
                        placeholder={resolveFieldPlaceholder(field)}
                      />
                    )}
                  </div>
                ))}

                <div className="erp-booking-field">
                  <div className="erp-booking-field-label">
                    Communication Preference
                    <span>*</span>
                  </div>
                  <select value={communicationPreference} onChange={(event) => setCommunicationPreference(event.target.value as 'EMAIL' | 'SMS')}>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="erp-booking-review-grid">
              <div className="erp-booking-review-card">
                <h4>預約摘要</h4>
                <dl>
                  <div>
                    <dt>活動名稱</dt>
                    <dd>{props.detail.event.eventName}</dd>
                  </div>
                  <div>
                    <dt>地點</dt>
                    <dd>{props.detail.event.location}</dd>
                  </div>
                  <div>
                    <dt>預約時段</dt>
                    <dd>{selectedSlot ? `${formatDisplayDate(selectedSlot.date)} ${selectedSlot.startTime}-${selectedSlot.endTime}` : '-'}</dd>
                  </div>
                  <div>
                    <dt>通知方式</dt>
                    <dd>{communicationPreference === 'EMAIL' ? 'Email' : 'SMS'}</dd>
                  </div>
                </dl>
              </div>

              <div className="erp-booking-review-card">
                <h4>個人資料</h4>
                <dl>
                  {reviewFields.map((field) => (
                    <div key={field.label}>
                      <dt>{field.label}</dt>
                      <dd>{field.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <label className="erp-booking-terms">
                <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                <span>
                  Only one registration will be accepted for each employee. To reschedule, cancel the existing booking and register again. Any
                  inaccurate information may result in an unsuccessful registration.
                </span>
              </label>
            </div>
          ) : null}

          <div className="erp-booking-actions">
            <button
              type="button"
              className="erp-booking-button is-secondary"
              onClick={() => {
                if (currentStep === 1) {
                  window.history.back();
                  return;
                }

                setCurrentStep((step) => Math.max(step - 1, 1));
              }}
            >
              返回
            </button>

            {currentStep === 1 ? (
              <button type="button" className="erp-booking-button is-primary" onClick={handleContinueFromSlot}>
                下一步
              </button>
            ) : null}

            {currentStep === 2 ? (
              <button type="button" className="erp-booking-button is-primary" onClick={handleContinueToReview}>
                下一步
              </button>
            ) : null}

            {currentStep === 3 ? (
              <button type="submit" disabled={isSubmitting} className="erp-booking-button is-primary">
                {isSubmitting ? 'Submitting...' : '確認提交'}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
