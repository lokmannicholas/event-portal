'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { EventDetailDTO } from '@flu-vax/contracts';
import { createErpBooking, createErpHold } from '../lib/erp-api';

type SlotOption = {
  documentId: string;
  date: string;
  label: string;
  enabled: boolean;
  remaining: number;
};

function formatRemaining(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function BookingForm(props: { detail: EventDetailDTO }) {
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [holdToken, setHoldToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
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

  useEffect(() => {
    setFieldValues(Object.fromEntries(registerFields.map((field) => [field.fieldKey, ''])));
  }, [registerFields]);

  const slots = useMemo<SlotOption[]>(
    () =>
      props.detail.event.dates.flatMap((date) =>
        date.slots.map((slot) => ({
          documentId: slot.documentId,
          date: date.date,
          label: `${date.date} ${slot.startTime}-${slot.endTime}`,
          enabled: date.enabled && slot.enabled && slot.remaining > 0,
          remaining: slot.remaining,
        })),
      ),
    [props.detail.event.dates],
  );
  const layoutColumns =
    props.detail.event.layoutMode === 'SPLIT'
      ? 'minmax(260px, 1.2fr) minmax(260px, 1fr)'
      : props.detail.event.layoutMode === 'SINGLE_COLUMN'
        ? '1fr'
        : 'repeat(auto-fit, minmax(220px, 1fr))';

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
        setMessage('The hold has expired. Please select the timeslot again.');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  async function handleHold(slot: SlotOption) {
    setIsHolding(true);
    setMessage('');
    try {
      const hold = await createErpHold({
        eventDocumentId: props.detail.event.documentId,
        eventSlotDocumentId: slot.documentId,
      });

      setSelectedSlot(slot);
      setHoldToken(hold.holdToken);
      setExpiresAt(hold.expiresAt);
      setCountdown(Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));
      setMessage(`Timeslot reserved temporarily. Complete the form before ${new Date(hold.expiresAt).toLocaleTimeString('en-GB')}.`);
    } catch {
      setSelectedSlot(null);
      setHoldToken('');
      setExpiresAt('');
      setCountdown(0);
      setMessage('Unable to reserve this timeslot right now. Please try again.');
    } finally {
      setIsHolding(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot || !holdToken) {
      setMessage('Please reserve a timeslot before submitting.');
      return;
    }

    if (!termsAccepted) {
      setMessage('Please acknowledge the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const booking = await createErpBooking({
        eventDocumentId: props.detail.event.documentId,
        eventSlotDocumentId: selectedSlot.documentId,
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
      setMessage('Booking confirmed. A confirmation email or SMS should be sent according to the selected communication preference.');
    } catch {
      setMessage('Unable to submit your booking right now. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="event-register-form" style={{ display: 'grid', gap: '18px' }}>
      {props.detail.event.customCss ? <style>{props.detail.event.customCss}</style> : null}

      <div className="event-register-slot" style={{ border: '1px solid #d9dfeb', borderRadius: '16px', padding: '18px', background: 'white' }}>
        <h3 style={{ marginTop: 0 }}>1. Select date and timeslot</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {slots.map((slot) => (
            <button
              key={slot.documentId}
              type="button"
              disabled={!slot.enabled || isHolding}
              onClick={() => handleHold(slot)}
              style={{
                background: selectedSlot?.documentId === slot.documentId ? '#174ea6' : slot.enabled ? '#eef5ff' : '#f2f4f7',
                color: selectedSlot?.documentId === slot.documentId ? 'white' : '#122033',
                textAlign: 'left',
                opacity: slot.enabled ? 1 : 0.6,
              }}
            >
              {slot.label} · Remaining: {slot.remaining}
            </button>
          ))}
        </div>

        {holdToken ? (
          <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: '#fff4e5', color: '#7a4b00' }}>
            Temporary hold active for {selectedSlot?.label}. Time left: <strong>{formatRemaining(countdown)}</strong>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px', border: '1px solid #d9dfeb', borderRadius: '16px', padding: '18px', background: 'white' }}>
        <h3 style={{ marginTop: 0 }}>2. Registration information</h3>

        <div className="event-register-fields" style={{ display: 'grid', gridTemplateColumns: layoutColumns, gap: '14px' }}>
          {registerFields.map((field) => (
            <label key={field.fieldKey} className="event-register-field" style={{ display: 'grid', gap: '6px' }}>
              <div style={{ marginBottom: '6px', fontWeight: 600 }}>
                {field.labelEn} {field.required ? '*' : ''}
              </div>
              {field.fieldType === 'TEXTAREA' ? (
                <textarea
                  value={getFieldValue(field.fieldKey)}
                  onChange={(event) => setFieldValue(field.fieldKey, event.target.value)}
                  required={field.required}
                  placeholder={field.placeholderEn}
                  rows={4}
                />
              ) : field.fieldType === 'CHECKBOX' ? (
                field.options && field.options.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {field.options.map((option) => {
                      const checked = getCheckboxValues(field.fieldKey).includes(option);

                      return (
                        <label key={option} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  <input
                    type="checkbox"
                    checked={getFieldValue(field.fieldKey) === 'true'}
                    onChange={(event) => setFieldValue(field.fieldKey, event.target.checked ? 'true' : '')}
                  />
                )
              ) : field.fieldType === 'RADIO' ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {(field.options ?? []).map((option) => (
                    <label key={option} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  placeholder={field.placeholderEn}
                />
              )}
            </label>
          ))}

          <label className="event-register-field" style={{ display: 'grid', gap: '6px' }}>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Communication Preference *</div>
            <select value={communicationPreference} onChange={(event) => setCommunicationPreference(event.target.value as 'EMAIL' | 'SMS')}>
              <option value="EMAIL">eMail</option>
              <option value="SMS">SMS</option>
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            style={{ width: '18px', marginTop: '2px' }}
          />
          <span style={{ lineHeight: 1.6 }}>
            Only one registration will be accepted for each employee. To reschedule, cancel your existing booking and register again.
            Any inaccurate information could result in unsuccessful registration.
          </span>
        </label>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={isSubmitting} className="event-register-submit" style={{ background: '#174ea6', color: 'white' }}>
            {isSubmitting ? 'Submitting…' : 'Submit registration'}
          </button>
          {submittedReference ? <div>Booking reference: <strong>{submittedReference}</strong></div> : null}
        </div>

        {message ? (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#eef5ff', color: '#174ea6' }}>
            {message}
          </div>
        ) : null}
      </form>
    </div>
  );
}
