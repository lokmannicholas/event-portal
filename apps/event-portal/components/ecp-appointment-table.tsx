'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EmptyState, InlineNotice, SimpleTable, StatusBadge } from '@event-portal/ui';
import type { AppointmentDTO } from '@event-portal/contracts';
import { cancelEcpAppointmentAction } from '../app/actions/ecp-appointment-actions';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';

type EcpAppointmentTableProps = {
  appointments: AppointmentDTO[];
  groupCode: string;
  eventCode: string;
  language?: PortalLanguage;
};

type FeedbackState =
  | {
      tone: 'success' | 'error';
      message: string;
    }
  | null;

export function EcpAppointmentTable(props: EcpAppointmentTableProps) {
  const language = props.language ?? 'en';
  const copy = {
    emptyTitle: getPortalText(language, 'No appointments yet', '尚未有預約'),
    emptyDescription: getPortalText(language, 'Appointments created from ERP registration will appear here for this event.', '由 ERP 登記建立的預約會顯示於此活動下。'),
    failedTitle: getPortalText(language, 'Cancellation failed', '取消失敗'),
    successTitle: getPortalText(language, 'Appointment cancelled', '預約已取消'),
    reference: getPortalText(language, 'Reference', '編號'),
    participant: getPortalText(language, 'Participant', '參加者'),
    contact: getPortalText(language, 'Contact', '聯絡方式'),
    slot: getPortalText(language, 'Date / Slot', '日期 / 時段'),
    status: getPortalText(language, 'Status', '狀態'),
    action: getPortalText(language, 'Action', '操作'),
    cancelled: getPortalText(language, 'Cancelled', '已取消'),
    cancel: getPortalText(language, 'Cancel', '取消'),
    cancelling: getPortalText(language, 'Cancelling...', '取消中...'),
    dialogTitle: getPortalText(language, 'Cancel appointment', '取消預約'),
    dialogDescription: getPortalText(
      language,
      'This will cancel the appointment, release the slot quota, and trigger the participant cancellation notice.',
      '此操作會取消預約、釋放時段名額，並觸發向參加者發送取消通知。',
    ),
    close: getPortalText(language, 'Close', '關閉'),
    keep: getPortalText(language, 'Keep appointment', '保留預約'),
    confirm: getPortalText(language, 'Confirm cancellation', '確認取消'),
  };
  const [appointments, setAppointments] = useState(props.appointments);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [submittingAppointmentId, setSubmittingAppointmentId] = useState<string | null>(null);
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    setAppointments(props.appointments);
  }, [props.appointments]);

  useEffect(() => {
    setIsDialogMounted(true);
  }, []);

  useEffect(() => {
    if (!activeAppointmentId || !dialogRef.current || dialogRef.current.open) {
      return;
    }

    dialogRef.current.showModal();
  }, [activeAppointmentId]);

  const activeAppointment = useMemo(
    () => appointments.find((appointment) => appointment.documentId === activeAppointmentId),
    [activeAppointmentId, appointments],
  );

  function closeDialog() {
    dialogRef.current?.close();
    setActiveAppointmentId(null);
  }

  function openDialog(appointmentDocumentId: string) {
    setFeedback(null);
    setActiveAppointmentId(appointmentDocumentId);
  }

  async function handleConfirmCancel() {
    if (!activeAppointment || submittingAppointmentId) {
      return;
    }

    setSubmittingAppointmentId(activeAppointment.documentId);
    setFeedback(null);

    const result = await cancelEcpAppointmentAction({
      groupCode: props.groupCode,
      eventCode: props.eventCode,
      appointmentDocumentId: activeAppointment.documentId,
      reason: 'Cancelled by client portal user.',
    });

    setSubmittingAppointmentId(null);

    if (result.status === 'FAILED') {
      setFeedback({
        tone: 'error',
        message: result.errorMessage || getPortalText(language, `Failed to cancel ${activeAppointment.bookingReference}.`, `無法取消 ${activeAppointment.bookingReference}。`),
      });
      closeDialog();
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.documentId === activeAppointment.documentId
          ? {
              ...appointment,
              status: 'CANCELLED',
            }
          : appointment,
      ),
    );
    setFeedback({
      tone: 'success',
      message: getPortalText(language, `${activeAppointment.bookingReference} was cancelled successfully.`, `${activeAppointment.bookingReference} 已成功取消。`),
    });
    closeDialog();
  }

  if (appointments.length === 0) {
    return <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />;
  }

  return (
    <>
      {feedback ? <InlineNotice title={feedback.tone === 'error' ? copy.failedTitle : copy.successTitle}>{feedback.message}</InlineNotice> : null}

      <SimpleTable
        columns={[
          { key: 'reference', label: copy.reference },
          { key: 'participant', label: copy.participant },
          { key: 'contact', label: copy.contact },
          { key: 'slot', label: copy.slot },
          { key: 'status', label: copy.status },
          { key: 'action', label: copy.action },
        ]}
        rows={appointments.map((appointment) => {
          const isCancelled = appointment.status === 'CANCELLED';
          const isSubmitting = submittingAppointmentId === appointment.documentId;

          return {
            reference: appointment.bookingReference,
            participant: appointment.participantName,
            contact: appointment.registeredEmail ?? appointment.mobileNumber ?? '-',
            slot: `${appointment.appointmentDate} ${appointment.appointmentStartTime}-${appointment.appointmentEndTime}`,
            status: <StatusBadge value={appointment.status} />,
            action: isCancelled ? (
              <span className="portal-table-action-muted">{copy.cancelled}</span>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary portal-table-action-button"
                disabled={Boolean(submittingAppointmentId)}
                onClick={() => openDialog(appointment.documentId)}
              >
                {isSubmitting ? copy.cancelling : copy.cancel}
              </button>
            ),
          };
        })}
      />

      {isDialogMounted
        ? createPortal(
            <dialog ref={dialogRef} className="portal-dialog">
              <div className="portal-dialog-form">
                <div className="portal-dialog-header">
                  <div>
                    <strong>{copy.dialogTitle}</strong>
                    <p>{copy.dialogDescription}</p>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDialog} disabled={Boolean(submittingAppointmentId)}>
                    {copy.close}
                  </button>
                </div>

                {activeAppointment ? (
                  <div className="portal-dialog-copy">
                    <p>
                      {getPortalText(
                        language,
                        <>Cancel <strong>{activeAppointment.bookingReference}</strong> for <strong>{activeAppointment.participantName}</strong>?</>,
                        <>確定取消 <strong>{activeAppointment.participantName}</strong> 的 <strong>{activeAppointment.bookingReference}</strong>？</>,
                      )}
                    </p>
                  </div>
                ) : null}

                <div className="portal-dialog-actions">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDialog} disabled={Boolean(submittingAppointmentId)}>
                    {copy.keep}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirmCancel} disabled={!activeAppointment || Boolean(submittingAppointmentId)}>
                    {submittingAppointmentId ? copy.cancelling : copy.confirm}
                  </button>
                </div>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
