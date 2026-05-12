'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { EventDetailDTO } from '@event-portal/contracts';
import { createErpBooking, createErpHold } from '../lib/erp-api';
import {
  getLocalizedCompanyName,
  getLocalizedDescription,
  getLocalizedEventName,
  getLocalizedFieldLabel,
  getLocalizedFieldPlaceholder,
  getLocalizedLocation,
  getLocalizedNotes,
  type ErpLanguage,
  isTraditionalChinese,
} from '../lib/erp-language';
import { resolveTemplateLayoutSettings } from '../lib/template-layout';

type SlotOption = {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  remaining: number;
};

type StatusTone = 'info' | 'warning' | 'success' | 'danger';

function getBookingThemeStyles(colors: {
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
    secondaryButton: {
      background: colors.surfaceBackground,
      borderColor: colors.fieldBorderColor ?? colors.surfaceBorderColor,
      color: colors.headingColor ?? colors.bodyTextColor,
    },
  } as const;
}

function formatRemaining(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDisplayDate(date: string, language: ErpLanguage) {
  const resolvedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(resolvedDate.getTime())) {
    return date;
  }

  return resolvedDate.toLocaleDateString(language === 'zh-Hant' ? 'zh-HK' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function BookingForm(props: { detail: EventDetailDTO; language: ErpLanguage }) {
  const isZh = isTraditionalChinese(props.language);
  const eventName = getLocalizedEventName(props.detail.event, props.language);
  const location = getLocalizedLocation(props.detail.event, props.language);
  const companyName = getLocalizedCompanyName(props.detail.event, props.language);
  const description = getLocalizedDescription(props.detail.event, props.language);
  const notes = getLocalizedNotes(props.detail.event, props.language);
  const copy = {
    bookingKicker: isZh ? '預約服務' : 'Appointment Booking',
    bookingTitle: isZh ? '疫苗接種預約登記' : 'Vaccination Booking Registration',
    bookingDescription: description || (isZh ? '選擇時段、填妥資料，再以三個步驟完成預約確認。' : 'Select a session, complete your details, and confirm the booking in three simple steps.'),
    eventNameLabel: isZh ? '活動名稱' : 'Event name',
    locationLabel: isZh ? '地點' : 'Location',
    companyLabel: isZh ? '服務機構' : 'Provider',
    registrationWindowLabel: isZh ? '登記日期' : 'Registration window',
    confirmationTitle: isZh ? '預約已確認' : 'Booking Confirmed',
    confirmationDescription: isZh ? '請保留以下資料，以便日後查詢或改期時使用。' : 'Keep the details below for future enquiry or rescheduling.',
    bookingReferenceLabel: isZh ? '預約編號' : 'Booking reference',
    appointmentLabel: isZh ? '預約時段' : 'Appointment',
    communicationLabel: isZh ? '通知方式' : 'Communication',
    bookingDetailsTitle: isZh ? '活動資料' : 'Booking details',
    registrationDetailsTitle: isZh ? '登記資料' : 'Registration details',
    progressAriaLabel: isZh ? '預約進度' : 'Booking progress',
    stepLabel: isZh ? '步驟' : 'Step',
    step1Title: isZh ? '選擇時段' : 'Select timeslot',
    step1Helper: isZh ? '選擇預約時段' : 'Select timeslot',
    step2Title: isZh ? '填寫個人資料' : 'Personal details',
    step2Helper: isZh ? '填寫登記資料' : 'Complete registration details',
    step3Title: isZh ? '確認資料' : 'Review details',
    step3Helper: isZh ? '確認並提交' : 'Review and submit',
    sectionStep1Title: isZh ? '選擇日期及時段' : 'Choose date and timeslot',
    sectionStep2Title: isZh ? '填寫登記資料' : 'Complete registration details',
    sectionStep3Title: isZh ? '確認預約資料' : 'Review booking details',
    sectionStep1Description: isZh ? '請先選擇一個可用時段，系統會暫時為你保留名額。' : 'Choose one available session to temporarily reserve your booking window.',
    sectionStep2Description: isZh ? '請按登記表格要求，準確填寫參加者資料。' : 'Enter the participant information exactly as required by the registration template.',
    sectionStep3Description: isZh ? '提交前請再次核對以下預約資料。' : 'Review the booking details below before final submission.',
    reservedTimeslotLabel: isZh ? '已保留時段' : 'Reserved timeslot',
    availableSessions: (count: number) => (isZh ? `可選時段 ${count} 個` : `${count} available session${count === 1 ? '' : 's'}`),
    quotaLeft: (count: number) => (isZh ? `餘額 ${count}` : `${count} quota left`),
    unavailable: isZh ? '不可用' : 'Unavailable',
    selected: isZh ? '已選擇' : 'Selected',
    choose: isZh ? '選擇' : 'Choose',
    closed: isZh ? '已關閉' : 'Closed',
    communicationPreferenceLabel: isZh ? '通知方式' : 'Communication Preference',
    selectPlaceholder: isZh ? '請選擇' : 'Please select',
    reviewSummaryTitle: isZh ? '預約摘要' : 'Booking summary',
    personalDetailsTitle: isZh ? '個人資料' : 'Personal details',
    selectedSlotLabel: isZh ? '預約時段' : 'Selected timeslot',
    termsText: isZh
      ? '每位員工只接受一個有效預約。如需改期，請先取消現有預約，再重新登記。資料不正確可能導致登記失敗。'
      : 'Only one registration will be accepted for each employee. To reschedule, cancel the existing booking and register again. Inaccurate information may result in an unsuccessful registration.',
    back: isZh ? '返回' : 'Back',
    next: isZh ? '下一步' : 'Next',
    submitting: isZh ? '提交中...' : 'Submitting...',
    submit: isZh ? '確認提交' : 'Confirm submission',
    holdExpired: isZh ? '已保留的時段已過期，請重新選擇時段。' : 'The reserved timeslot has expired. Please choose a new timeslot to continue.',
    holdUntil: (expiresAt: string) =>
      isZh
        ? `時段已暫時保留至 ${new Date(expiresAt).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}。`
        : `Timeslot reserved temporarily until ${new Date(expiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`,
    holdUnavailable: isZh ? '暫時未能保留此時段，請稍後再試。' : 'Unable to reserve this timeslot right now. Please try again.',
    pickTimeslotFirst: isZh ? '請先選擇一個可用時段，再繼續。' : 'Please choose an available timeslot before continuing.',
    selectionInactive: isZh ? '你所選的時段已失效，請重新選擇。' : 'Your timeslot selection is no longer active. Please select it again.',
    reserveBeforeSubmit: isZh ? '提交前請先保留一個預約時段。' : 'Please reserve a timeslot before submitting.',
    acceptTerms: isZh ? '提交前請先確認預約條款。' : 'Please acknowledge the booking terms before submitting.',
    submitSuccess: isZh ? '預約已確認。系統會按所選通知方式發送確認電郵或短訊。' : 'Booking confirmed. A confirmation email or SMS will be sent according to the selected communication preference.',
    submitFailure: isZh ? '暫時未能提交預約，請稍後再試或聯絡支援。' : 'Unable to submit your booking right now. Please try again or contact support.',
  };
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
  const resolvedLayout = useMemo(
    () => resolveTemplateLayoutSettings(registerFields.map((field) => field.fieldKey), props.detail.event.layoutSettings),
    [props.detail.event.layoutSettings, registerFields],
  );
  const themeStyles = getBookingThemeStyles(resolvedLayout.colors);
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
  const fieldByKey = new Map(registerFields.map((field) => [field.fieldKey, field]));
  const leftColumnFields = resolvedLayout.fieldPositions
    .filter((position) => position.column === 'left')
    .map((position) => fieldByKey.get(position.fieldKey))
    .filter((field): field is (typeof registerFields)[number] => Boolean(field));
  const rightColumnFields = resolvedLayout.fieldPositions
    .filter((position) => position.column === 'right')
    .map((position) => fieldByKey.get(position.fieldKey))
    .filter((field): field is (typeof registerFields)[number] => Boolean(field));
  const fullWidthFields = resolvedLayout.fieldPositions
    .filter((position) => position.column === 'full')
    .map((position) => fieldByKey.get(position.fieldKey))
    .filter((field): field is (typeof registerFields)[number] => Boolean(field));
  const stackedFields = leftColumnFields.length > 0 && rightColumnFields.length > 0 ? [] : [...leftColumnFields, ...rightColumnFields];
  const titleAlignment = resolvedLayout.titlePosition;
  const layoutColumns = leftColumnFields.length > 0 && rightColumnFields.length > 0 ? 'repeat(2, minmax(0, 1fr))' : '1fr';
  const detailSummaryItems = [
    { label: copy.eventNameLabel, value: eventName },
    { label: copy.locationLabel, value: location },
    { label: copy.companyLabel, value: companyName },
    {
      label: copy.registrationWindowLabel,
      value: `${props.detail.event.registrationStartDate} - ${props.detail.event.registrationEndDate}`,
    },
  ];
  const reviewFields = registerFields
    .map((field) => ({
      label: getLocalizedFieldLabel(field, props.language),
      value: field.fieldType === 'CHECKBOX' ? getCheckboxValues(field.fieldKey).join(', ') : getFieldValue(field.fieldKey),
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
        setStatus({ tone: 'warning', text: copy.holdExpired });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [copy.holdExpired, expiresAt]);

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

  function renderFieldInput(field: (typeof registerFields)[number]) {
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

  function renderFieldCard(field: (typeof registerFields)[number]) {
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
        text: copy.holdUntil(hold.expiresAt),
      });
    } catch {
      setSelectedSlot(null);
      setHoldToken('');
      setExpiresAt('');
      setCountdown(0);
      setStatus({ tone: 'danger', text: copy.holdUnavailable });
    } finally {
      setIsHolding(false);
    }
  }

  function handleContinueFromSlot() {
    if (!selectedSlot || !holdToken) {
      setStatus({ tone: 'danger', text: copy.pickTimeslotFirst });
      return;
    }

    setCurrentStep(2);
    setStatus(null);
  }

  function handleContinueToReview() {
    if (!selectedSlot || !holdToken) {
      setCurrentStep(1);
      setStatus({ tone: 'danger', text: copy.selectionInactive });
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
      setStatus({ tone: 'danger', text: copy.reserveBeforeSubmit });
      return;
    }

    if (!termsAccepted) {
      setStatus({ tone: 'danger', text: copy.acceptTerms });
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
        text: copy.submitSuccess,
      });
    } catch {
      setStatus({ tone: 'danger', text: copy.submitFailure });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedReference) {
    return (
      <div className="erp-booking-flow" style={themeStyles.flow}>
        {props.detail.event.customCss ? <style>{props.detail.event.customCss}</style> : null}

        <section className="erp-booking-banner" style={themeStyles.surface}>
          <div className="erp-booking-banner-copy" style={{ textAlign: titleAlignment }}>
            <span className="erp-booking-kicker" style={themeStyles.accent}>{copy.bookingKicker}</span>
            <h2 style={themeStyles.heading}>{copy.confirmationTitle}</h2>
            <p>{copy.confirmationDescription}</p>
          </div>
          <div className="erp-booking-summary-grid">
            <div className="erp-booking-summary-card is-highlighted" style={themeStyles.surface}>
              <span>{copy.bookingReferenceLabel}</span>
              <strong style={themeStyles.heading}>{submittedReference}</strong>
            </div>
            <div className="erp-booking-summary-card" style={themeStyles.surface}>
              <span>{copy.appointmentLabel}</span>
              <strong style={themeStyles.heading}>{selectedSlot ? `${formatDisplayDate(selectedSlot.date, props.language)} ${selectedSlot.startTime}-${selectedSlot.endTime}` : eventName}</strong>
            </div>
            <div className="erp-booking-summary-card" style={themeStyles.surface}>
              <span>{copy.communicationLabel}</span>
              <strong style={themeStyles.heading}>{communicationPreference === 'EMAIL' ? (isZh ? '電郵' : 'Email') : 'SMS'}</strong>
            </div>
          </div>
        </section>

        <section className="erp-booking-shell" style={themeStyles.surface}>
          {status ? (
            <div className={`erp-booking-status is-${status.tone}`}>
              <span className="erp-booking-status-dot" aria-hidden="true" />
              <span>{status.text}</span>
            </div>
          ) : null}

          <div className="erp-booking-review-grid">
            <div className="erp-booking-review-card" style={themeStyles.surface}>
              <h3 style={themeStyles.heading}>{copy.bookingDetailsTitle}</h3>
              <dl>
                <div>
                  <dt>{copy.eventNameLabel}</dt>
                  <dd>{eventName}</dd>
                </div>
                <div>
                  <dt>{copy.locationLabel}</dt>
                  <dd>{location}</dd>
                </div>
                <div>
                  <dt>{copy.selectedSlotLabel}</dt>
                  <dd>{selectedSlot ? `${formatDisplayDate(selectedSlot.date, props.language)} ${selectedSlot.startTime}-${selectedSlot.endTime}` : '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="erp-booking-review-card" style={themeStyles.surface}>
              <h3 style={themeStyles.heading}>{copy.registrationDetailsTitle}</h3>
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
    <div className="erp-booking-flow" style={themeStyles.flow}>
      {props.detail.event.customCss ? <style>{props.detail.event.customCss}</style> : null}

      <section className="erp-booking-banner" style={themeStyles.surface}>
        <div className="erp-booking-banner-copy" style={{ textAlign: titleAlignment }}>
          <span className="erp-booking-kicker" style={themeStyles.accent}>{copy.bookingKicker}</span>
          <h2 style={themeStyles.heading}>{copy.bookingTitle}</h2>
          <p>{copy.bookingDescription}</p>
        </div>
        <div className="erp-booking-summary-grid">
          {detailSummaryItems.map((item) => (
            <div key={item.label} className="erp-booking-summary-card" style={themeStyles.surface}>
              <span>{item.label}</span>
              <strong style={themeStyles.heading}>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="erp-booking-stepper" aria-label={copy.progressAriaLabel}>
        {[
          { index: 1, label: copy.step1Title, helper: copy.step1Helper },
          { index: 2, label: copy.step2Title, helper: copy.step2Helper },
          { index: 3, label: copy.step3Title, helper: copy.step3Helper },
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

      <section className="erp-booking-shell" style={themeStyles.surface}>
        <div className="erp-booking-shell-heading">
          <div style={{ textAlign: titleAlignment }}>
            <span className="erp-booking-shell-kicker" style={themeStyles.accent}>
              {copy.stepLabel} {currentStep}
            </span>
            <h3 style={themeStyles.heading}>
              {currentStep === 1
                ? copy.sectionStep1Title
                : currentStep === 2
                  ? copy.sectionStep2Title
                  : copy.sectionStep3Title}
            </h3>
            <p>
              {currentStep === 1
                ? copy.sectionStep1Description
                : currentStep === 2
                  ? copy.sectionStep2Description
                  : copy.sectionStep3Description}
            </p>
          </div>
          {holdToken && selectedSlot ? (
            <div className="erp-booking-timer-card" style={themeStyles.surface}>
              <span>{copy.reservedTimeslotLabel}</span>
              <strong style={themeStyles.heading}>{formatRemaining(countdown)}</strong>
              <small>
                {formatDisplayDate(selectedSlot.date, props.language)} {selectedSlot.startTime}-{selectedSlot.endTime}
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
                <section key={group.date} className="erp-booking-slot-group" style={themeStyles.surface}>
                  <div className="erp-booking-slot-group-header">
                    <div>
                      <h4 style={themeStyles.heading}>{formatDisplayDate(group.date, props.language)}</h4>
                      <span>{copy.availableSessions(group.slots.filter((slot) => slot.enabled).length)}</span>
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
                          style={themeStyles.surface}
                        >
                          <div className="erp-booking-slot-time">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="erp-booking-slot-meta">
                            <span>{slot.enabled ? copy.quotaLeft(slot.remaining) : copy.unavailable}</span>
                            <strong>{isSelected ? copy.selected : slot.enabled ? copy.choose : copy.closed}</strong>
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

                <div className="erp-booking-fields-column is-full">
                  <div className="erp-booking-field" style={themeStyles.surface}>
                    <div className="erp-booking-field-label" style={themeStyles.heading}>
                      {copy.communicationPreferenceLabel}
                      <span>*</span>
                    </div>
                    <select
                      value={communicationPreference}
                      onChange={(event) => setCommunicationPreference(event.target.value as 'EMAIL' | 'SMS')}
                      style={themeStyles.field}
                    >
                      <option value="EMAIL">{isZh ? '電郵' : 'Email'}</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="erp-booking-review-grid">
              <div className="erp-booking-review-card" style={themeStyles.surface}>
                <h4 style={themeStyles.heading}>{copy.reviewSummaryTitle}</h4>
                <dl>
                  <div>
                    <dt>{copy.eventNameLabel}</dt>
                    <dd>{eventName}</dd>
                  </div>
                  <div>
                    <dt>{copy.locationLabel}</dt>
                    <dd>{location}</dd>
                  </div>
                  <div>
                    <dt>{copy.selectedSlotLabel}</dt>
                    <dd>{selectedSlot ? `${formatDisplayDate(selectedSlot.date, props.language)} ${selectedSlot.startTime}-${selectedSlot.endTime}` : '-'}</dd>
                  </div>
                  <div>
                    <dt>{copy.communicationLabel}</dt>
                    <dd>{communicationPreference === 'EMAIL' ? (isZh ? '電郵' : 'Email') : 'SMS'}</dd>
                  </div>
                </dl>
              </div>

              <div className="erp-booking-review-card" style={themeStyles.surface}>
                <h4 style={themeStyles.heading}>{copy.personalDetailsTitle}</h4>
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
                <span>{copy.termsText}</span>
              </label>
            </div>
          ) : null}

          <div className="erp-booking-actions">
            <button
              type="button"
              className="erp-booking-button is-secondary"
              style={themeStyles.secondaryButton}
              onClick={() => {
                if (currentStep === 1) {
                  window.history.back();
                  return;
                }

                setCurrentStep((step) => Math.max(step - 1, 1));
              }}
            >
              {copy.back}
            </button>

            {currentStep === 1 ? (
              <button type="button" className="erp-booking-button is-primary" style={themeStyles.primaryButton} onClick={handleContinueFromSlot}>
                {copy.next}
              </button>
            ) : null}

            {currentStep === 2 ? (
              <button type="button" className="erp-booking-button is-primary" style={themeStyles.primaryButton} onClick={handleContinueToReview}>
                {copy.next}
              </button>
            ) : null}

            {currentStep === 3 ? (
              <button type="submit" disabled={isSubmitting} className="erp-booking-button is-primary" style={themeStyles.primaryButton}>
                {isSubmitting ? copy.submitting : copy.submit}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
