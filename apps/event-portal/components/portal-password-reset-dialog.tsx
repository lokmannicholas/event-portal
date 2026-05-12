'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InlineNotice } from '@event-portal/ui';
import type { ChangePasswordState } from '../app/actions/portal-account-actions';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';

const initialState: ChangePasswordState = {
  status: 'idle',
};

type PortalPasswordResetDialogProps = {
  action: (state: ChangePasswordState, formData: FormData) => Promise<ChangePasswordState>;
  groupCode?: string;
  language?: PortalLanguage;
};

export function PortalPasswordResetDialog(props: PortalPasswordResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  const [state, formAction] = useActionState(props.action, initialState);
  const language = props.language ?? 'en';
  const copy = {
    trigger: getPortalText(language, 'Reset password', '重設密碼'),
    title: getPortalText(language, 'Reset password', '重設密碼'),
    description: getPortalText(
      language,
      'Enter your old password and a new password. The update only applies to your own signed-in account.',
      '請輸入舊密碼和新密碼。此更新只會套用到你目前登入的帳戶。',
    ),
    close: getPortalText(language, 'Close', '關閉'),
    oldPassword: getPortalText(language, 'Old password', '舊密碼'),
    newPassword: getPortalText(language, 'New password', '新密碼'),
    submit: getPortalText(language, 'Update password', '更新密碼'),
  };

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
        {copy.trigger}
      </button>

      {isDialogMounted
        ? createPortal(
            <dialog ref={dialogRef} className="portal-dialog">
              <form ref={formRef} action={formAction} className="portal-dialog-form">
                {props.groupCode ? <input type="hidden" name="groupCode" value={props.groupCode} /> : null}

                <div className="portal-dialog-header">
                  <div>
                    <strong>{copy.title}</strong>
                    <p>{copy.description}</p>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => dialogRef.current?.close()}>
                    {copy.close}
                  </button>
                </div>

                {state.status !== 'idle' && state.message ? <InlineNotice title={copy.title}>{state.message}</InlineNotice> : null}

                <div className="portal-dialog-grid">
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.oldPassword}</span>
                    <input name="currentPassword" type="password" autoComplete="current-password" required />
                  </label>
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.newPassword}</span>
                    <input name="password" type="password" autoComplete="new-password" required />
                  </label>
                </div>

                <div className="portal-dialog-actions">
                  <button type="submit" className="btn btn-primary">
                    {copy.submit}
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
