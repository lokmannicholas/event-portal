'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EmptyState, InlineNotice, SimpleTable, StatusBadge } from '@event-portal/ui';
import type { AppointmentDTO } from '@event-portal/contracts';
import { cancelEcpAppointmentAction } from '../app/actions/ecp-appointment-actions';

type EcpAppointmentTableProps = {
  appointments: AppointmentDTO[];
  groupCode: string;
  eventCode: string;
};

type FeedbackState =
  | {
      tone: 'success' | 'error';
      message: string;
    }
  | null;

export function EcpAppointmentTable(props: EcpAppointmentTableProps) {
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
        message: result.errorMessage || `Failed to cancel ${activeAppointment.bookingReference}.`,
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
      message: `${activeAppointment.bookingReference} was cancelled successfully.`,
    });
    closeDialog();
  }

  if (appointments.length === 0) {
    return <EmptyState title="No appointments yet" description="Appointments created from ERP registration will appear here for this event." />;
  }

  return (
    <>
      {feedback ? <InlineNotice title={feedback.tone === 'error' ? 'Cancellation failed' : 'Appointment cancelled'}>{feedback.message}</InlineNotice> : null}

      <SimpleTable
        columns={[
          { key: 'reference', label: 'Reference' },
          { key: 'participant', label: 'Participant' },
          { key: 'contact', label: 'Contact' },
          { key: 'slot', label: 'Date / Slot' },
          { key: 'status', label: 'Status' },
          { key: 'action', label: 'Action' },
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
              <span className="portal-table-action-muted">Cancelled</span>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary portal-table-action-button"
                disabled={Boolean(submittingAppointmentId)}
                onClick={() => openDialog(appointment.documentId)}
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel'}
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
                    <strong>Cancel appointment</strong>
                    <p>This will cancel the appointment, release the slot quota, and trigger the participant cancellation notice.</p>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDialog} disabled={Boolean(submittingAppointmentId)}>
                    Close
                  </button>
                </div>

                {activeAppointment ? (
                  <div className="portal-dialog-copy">
                    <p>
                      Cancel <strong>{activeAppointment.bookingReference}</strong> for <strong>{activeAppointment.participantName}</strong>?
                    </p>
                  </div>
                ) : null}

                <div className="portal-dialog-actions">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDialog} disabled={Boolean(submittingAppointmentId)}>
                    Keep appointment
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirmCancel} disabled={!activeAppointment || Boolean(submittingAppointmentId)}>
                    {submittingAppointmentId ? 'Cancelling...' : 'Confirm cancellation'}
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
