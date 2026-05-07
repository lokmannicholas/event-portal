'use client';

import { useEffect, useMemo, useState } from 'react';
import { PaginationControls, SimpleTable, Stack, StatusBadge } from '@event-portal/ui';
import type { AppointmentDTO, EventListItemDTO, NoticeDTO, NotificationType } from '@event-portal/contracts';
import { sendSingleNoticeAction } from '../app/actions/notice-actions';
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
          <span className="portal-field-label">Event</span>
          <select value={selectedEventDocumentId} onChange={(event) => setSelectedEventDocumentId(event.target.value)}>
            <option value="">Not selected</option>
            {props.events.map((event) => (
              <option key={event.documentId} value={event.documentId}>
                {event.eventName} · {event.eventCode}
              </option>
            ))}
          </select>
        </label>

        <label className="portal-field">
          <span className="portal-field-label">Notice type</span>
          <select value={noticeType} onChange={(event) => setNoticeType(event.target.value as NotificationType)}>
            <option value="REGISTRATION">REGISTRATION</option>
            <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
            <option value="EVENT_UPDATE">EVENT_UPDATE</option>
          </select>
        </label>
      </div>

      <div className="portal-field-full">
        <div className="portal-table-header">
          <span className="portal-field-label">Appointments</span>
          <span className="portal-selection-summary">
            {selectedAppointmentIds.length} / {MAX_SELECTION} selected
          </span>
        </div>
        <p className="portal-helper-text">
          Select up to {MAX_SELECTION} appointments. Notices are sent one by one in the selected order.
        </p>
        <SimpleTable
          columns={[
            { key: 'select', label: '' },
            { key: 'reference', label: 'Reference' },
            { key: 'participant', label: 'Participant' },
            { key: 'contact', label: 'Contact' },
            { key: 'preference', label: 'Preference' },
            { key: 'slot', label: 'Date / Slot' },
            { key: 'history', label: 'History' },
            { key: 'result', label: 'Result' },
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
                    <span className="portal-send-result success" title="Sent successfully">
                      <SuccessIcon />
                    </span>
                  ) : lastResultStatus === 'FAILED' ? (
                    <span className="portal-send-result-inline">
                      <span className="portal-send-result failed" title={lastErrorMessage ?? 'Failed'}>
                        <FailedIcon />
                      </span>
                      <span className="portal-send-result-message">{lastErrorMessage ?? 'Failed'}</span>
                    </span>
                  ) : rowState.status === 'SENDING' ? (
                    <span className="portal-send-result pending">Sending...</span>
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
              ? 'No appointments.'
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredAppointments.length)} of ${filteredAppointments.length} appointments.`}
          </div>
          {totalPages > 1 ? (
            <nav className="portal-pagination-links" aria-label="Appointment pagination">
              <button type="button" className="portal-pagination-link" disabled={currentPage === 1} onClick={() => setPage(1)}>
                First
              </button>
              <button type="button" className="portal-pagination-link" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous
              </button>
              <span className="portal-pagination-link is-active" aria-current="page">
                {currentPage}
              </span>
              <button type="button" className="portal-pagination-link" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                Next
              </button>
              <button type="button" className="portal-pagination-link" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>
                Last
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
          {sending ? 'Sending...' : 'Send notices'}
        </button>
        <a href="/notices" className="btn btn-outline-secondary">
          Back to history
        </a>
      </ActionRow>
    </Stack>
  );
}
