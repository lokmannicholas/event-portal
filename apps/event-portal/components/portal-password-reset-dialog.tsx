'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InlineNotice } from '@event-portal/ui';
import type { ChangePasswordState } from '../app/actions/portal-account-actions';

const initialState: ChangePasswordState = {
  status: 'idle',
};

type PortalPasswordResetDialogProps = {
  action: (state: ChangePasswordState, formData: FormData) => Promise<ChangePasswordState>;
  groupCode?: string;
};

export function PortalPasswordResetDialog(props: PortalPasswordResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  const [state, formAction] = useActionState(props.action, initialState);

  useEffect(() => {
    setIsDialogMounted(true);
  }, []);

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <>
      <button type="button" className="btn btn-outline-secondary portal-block-button" onClick={() => dialogRef.current?.showModal()}>
        Reset password
      </button>

      {isDialogMounted
        ? createPortal(
            <dialog ref={dialogRef} className="portal-dialog">
              <form ref={formRef} action={formAction} className="portal-dialog-form">
                {props.groupCode ? <input type="hidden" name="groupCode" value={props.groupCode} /> : null}

                <div className="portal-dialog-header">
                  <div>
                    <strong>Reset password</strong>
                    <p>Enter your old password and a new password. The update only applies to your own signed-in account.</p>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => dialogRef.current?.close()}>
                    Close
                  </button>
                </div>

                {state.status !== 'idle' && state.message ? <InlineNotice title="Reset password">{state.message}</InlineNotice> : null}

                <div className="portal-dialog-grid">
                  <label className="portal-field">
                    <span className="portal-field-label">Old password</span>
                    <input name="currentPassword" type="password" autoComplete="current-password" required />
                  </label>
                  <label className="portal-field">
                    <span className="portal-field-label">New password</span>
                    <input name="password" type="password" autoComplete="new-password" required />
                  </label>
                </div>

                <div className="portal-dialog-actions">
                  <button type="submit" className="btn btn-primary">
                    Update password
                  </button>
                </div>
              </form>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
