'use client';

import { useEffect, useMemo, useState } from 'react';
import { PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import type { AppointmentDTO, EventListItemDTO, NoticeDTO, NotificationType } from '@event-portal/contracts';
import { sendSingleNoticeAction } from '../app/actions/notice-actions';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';
import { ActionRow } from './admin-forms';

const MAX_SELECTION = 20;
const PAGE_SIZE = 10;

type SendRowState = {
  status: 'IDLE' | 'SENDING' | 'SENT' | 'FAILED';
  errorMessage?: string;
};

type NoticeSendPanelProps = {
  events: EventListItemDTO[];
  appointments: AppointmentDTO[];
  notices: NoticeDTO[];
  initialEventDocumentId?: string;
  language?: PortalLanguage;
};

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M9.55 16.6 5.4 12.45l1.4-1.4 2.75 2.75 7.65-7.65 1.4 1.4Z" fill="currentColor" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="m13.4 12 4.9-4.9-1.4-1.4-4.9 4.9-4.9-4.9-1.4 1.4 4.9 4.9-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4Z" fill="currentColor" />
    </svg>
  );
}

export function NoticeSendPanel(props: NoticeSendPanelProps) {
  const language = props.language ?? 'en';
  const copy = {
    event: getPortalText(language, 'Event', '活動'),
    notSelected: getPortalText(language, 'Not selected', '未選擇'),
    noticeType: getPortalText(language, 'Notice type', '通知類型'),
    appointments: getPortalText(language, 'Appointments', '預約'),
    selected: (count: number) => getPortalText(language, `${count} / ${MAX_SELECTION} selected`, `已選擇 ${count} / ${MAX_SELECTION}`),
    helper: getPortalText(language, `Select up to ${MAX_SELECTION} appointments. Notices are sent one by one in the selected order.`, `最多可選擇 ${MAX_SELECTION} 個預約。通知會按所選次序逐一發送。`),
    reference: getPortalText(language, 'Reference', '編號'),
    participant: getPortalText(language, 'Participant', '參加者'),
    contact: getPortalText(language, 'Contact', '聯絡方式'),
    preference: getPortalText(language, 'Preference', '偏好'),
    slot: getPortalText(language, 'Date / Slot', '日期 / 時段'),
    history: getPortalText(language, 'History', '歷史'),
    result: getPortalText(language, 'Result', '結果'),
    sentSuccessfully: getPortalText(language, 'Sent successfully', '發送成功'),
    failed: getPortalText(language, 'Failed', '失敗'),
    sending: getPortalText(language, 'Sending...', '發送中...'),
    noAppointments: getPortalText(language, 'No appointments.', '沒有預約。'),
    showing: (start: number, end: number, total: number) => getPortalText(language, `Showing ${start}-${end} of ${total} appointments.`, `顯示第 ${start}-${end} 項，共 ${total} 個預約。`),
    pagination: getPortalText(language, 'Appointment pagination', '預約分頁'),
    first: getPortalText(language, 'First', '最前'),
    previous: getPortalText(language, 'Previous', '上一頁'),
    next: getPortalText(language, 'Next', '下一頁'),
    last: getPortalText(language, 'Last', '最後'),
    sendNotices: getPortalText(language, 'Send notices', '發送通知'),
    backToHistory: getPortalText(language, 'Back to history', '返回通知記錄'),
  };
  const [selectedEventDocumentId, setSelectedEventDocumentId] = useState(props.initialEventDocumentId ?? '');
  const [noticeType, setNoticeType] = useState<NotificationType>('REGISTRATION');
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [sendRows, setSendRows] = useState<Record<string, SendRowState>>({});
  const [sentHistoryIds, setSentHistoryIds] = useState<Set<string>>(
    new Set(
      props.notices
        .filter((notice) => notice.status === 'SENT' && typeof notice.appointmentDocumentId === 'string')
        .map((notice) => String(notice.appointmentDocumentId)),
    ),
  );
  const latestNoticeByAppointmentId = useMemo(() => {
    const entries = props.notices
      .filter((notice) => typeof notice.appointmentDocumentId === 'string' && notice.appointmentDocumentId)
      .slice()
      .sort((left, right) => {
        const leftTime = Date.parse(left.createdAt ?? left.updatedAt ?? left.sentAt ?? '');
        const rightTime = Date.parse(right.createdAt ?? right.updatedAt ?? right.sentAt ?? '');
        return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
      });

    const result = new Map<string, NoticeDTO>();

    for (const notice of entries) {
      const appointmentDocumentId = String(notice.appointmentDocumentId);

      if (!result.has(appointmentDocumentId)) {
        result.set(appointmentDocumentId, notice);
      }
    }

    return result;
  }, [props.notices]);

  const filteredAppointments = useMemo(() => {
    if (!selectedEventDocumentId) {
      return props.appointments;
    }

    return props.appointments.filter((appointment) => appointment.eventDocumentId === selectedEventDocumentId);
  }, [props.appointments, selectedEventDocumentId]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAppointments = filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setSelectedAppointmentIds((current) =>
      current.filter((appointmentId) =>
        props.appointments.some(
          (appointment) =>
            appointment.documentId === appointmentId &&
            (!selectedEventDocumentId || appointment.eventDocumentId === selectedEventDocumentId),
        ),
      ),
    );
    setSendRows({});
  }, [props.appointments, selectedEventDocumentId]);

  function toggleAppointment(documentId: string) {
    setSelectedAppointmentIds((current) => {
      if (current.includes(documentId)) {
        return current.filter((value) => value !== documentId);
      }

      if (current.length >= MAX_SELECTION) {
        return current;
      }

      return [...current, documentId];
    });
  }

  async function handleSend() {
    if (!selectedEventDocumentId || selectedAppointmentIds.length === 0 || sending) {
      return;
    }

    setSending(true);

    for (const appointmentDocumentId of selectedAppointmentIds) {
      setSendRows((current) => ({
        ...current,
        [appointmentDocumentId]: { status: 'SENDING' },
      }));

      const result = await sendSingleNoticeAction({
        eventDocumentId: selectedEventDocumentId,
        noticeType,
        appointmentDocumentId,
      });

      setSendRows((current) => ({
        ...current,
        [appointmentDocumentId]: {
          status: result.status,
          errorMessage: result.errorMessage,
        },
      }));

      if (result.status === 'SENT') {
        setSentHistoryIds((current) => {
          const next = new Set(current);
          next.add(appointmentDocumentId);
          return next;
        });
      }
    }

    setSending(false);
  }

  const selectionLimitReached = selectedAppointmentIds.length >= MAX_SELECTION;

  return (
    <Stack gap={16}>
      <div className="portal-form-grid">
        <label className="portal-field">
          <span className="portal-field-label">{copy.event}</span>
          <select value={selectedEventDocumentId} onChange={(event) => setSelectedEventDocumentId(event.target.value)}>
            <option value="">{copy.notSelected}</option>
            {props.events.map((event) => (
              <option key={event.documentId} value={event.documentId}>
                {event.eventName} · {event.eventCode}
              </option>
            ))}
          </select>
        </label>

        <label className="portal-field">
          <span className="portal-field-label">{copy.noticeType}</span>
          <select value={noticeType} onChange={(event) => setNoticeType(event.target.value as NotificationType)}>
            <option value="REGISTRATION">REGISTRATION</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
            <option value="EVENT_UPDATE">EVENT_UPDATE</option>
          </select>
        </label>
      </div>

      <div className="portal-field-full">
        <div className="portal-table-header">
          <span className="portal-field-label">{copy.appointments}</span>
          <span className="portal-selection-summary">
            {copy.selected(selectedAppointmentIds.length)}
          </span>
        </div>
        <p className="portal-helper-text">{copy.helper}</p>
        <SimpleTable
          columns={[
            { key: 'select', label: '' },
            { key: 'reference', label: copy.reference },
            { key: 'participant', label: copy.participant },
            { key: 'contact', label: copy.contact },
            { key: 'preference', label: copy.preference },
            { key: 'slot', label: copy.slot },
            { key: 'history', label: copy.history },
            { key: 'result', label: copy.result },
          ]}
          rows={pagedAppointments.map((appointment) => {
            const checked = selectedAppointmentIds.includes(appointment.documentId);
            const rowState = sendRows[appointment.documentId] ?? { status: 'IDLE' as const };
            const sentBefore = sentHistoryIds.has(appointment.documentId);
            const latestNotice = latestNoticeByAppointmentId.get(appointment.documentId);
            const lastResultStatus =
              rowState.status !== 'IDLE'
                ? rowState.status
                : latestNotice?.status === 'SENT'
                  ? 'SENT'
                  : latestNotice?.status === 'FAILED'
                    ? 'FAILED'
                    : undefined;
            const lastErrorMessage = rowState.status === 'FAILED' ? rowState.errorMessage : latestNotice?.errorMessage;

            return {
              select: (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={sending || (!checked && selectionLimitReached)}
                  onChange={() => toggleAppointment(appointment.documentId)}
                  aria-label={`Select ${appointment.bookingReference}`}
                />
              ),
              reference: appointment.bookingReference,
              participant: (
                <div>
                  <div style={{ fontWeight: 700 }}>{appointment.participantName}</div>
                  <div style={{ color: '#5b677a', fontSize: '13px' }}>{appointment.eventName}</div>
                </div>
              ),
              contact: appointment.registeredEmail ?? appointment.mobileNumber ?? '-',
              preference: appointment.communicationPreference,
              slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
              history: sentBefore ? <StatusBadge value="SENT" /> : '-',
              result: (
                <div className="portal-send-result-cell">
                  {lastResultStatus === 'SENT' ? (
                    <span className="portal-send-result success" title={copy.sentSuccessfully}>
                      <SuccessIcon />
                    </span>
                  ) : lastResultStatus === 'FAILED' ? (
                    <span className="portal-send-result-inline">
                      <span className="portal-send-result failed" title={lastErrorMessage ?? copy.failed}>
                        <FailedIcon />
                      </span>
                      <span className="portal-send-result-message">{lastErrorMessage ?? copy.failed}</span>
                    </span>
                  ) : rowState.status === 'SENDING' ? (
                    <span className="portal-send-result pending">{copy.sending}</span>
                  ) : (
                    '-'
                  )}
                </div>
              ),
            };
          })}
        />

        <div className="portal-pagination">
          <div className="portal-pagination-summary">
            {filteredAppointments.length === 0
              ? copy.noAppointments
              : copy.showing((currentPage - 1) * PAGE_SIZE + 1, Math.min(currentPage * PAGE_SIZE, filteredAppointments.length), filteredAppointments.length)}
          </div>
          {totalPages > 1 ? (
            <nav className="portal-pagination-links" aria-label={copy.pagination}>
              <button type="button" className="portal-pagination-link" disabled={currentPage === 1} onClick={() => setPage(1)}>
                {copy.first}
              </button>
              <button type="button" className="portal-pagination-link" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                {copy.previous}
              </button>
              <span className="portal-pagination-link is-active" aria-current="page">
                {currentPage}
              </span>
              <button type="button" className="portal-pagination-link" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                {copy.next}
              </button>
              <button type="button" className="portal-pagination-link" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>
                {copy.last}
              </button>
            </nav>
          ) : null}
        </div>
      </div>

      <ActionRow>
        <button
          type="button"
          className="btn btn-primary"
          disabled={sending || !selectedEventDocumentId || selectedAppointmentIds.length === 0}
          onClick={() => void handleSend()}
        >
          {sending ? copy.sending : copy.sendNotices}
        </button>
        <a href="/notices" className="btn btn-outline-secondary">
          {copy.backToHistory}
        </a>
      </ActionRow>
    </Stack>
  );
}
