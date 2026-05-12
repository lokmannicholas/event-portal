'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InlineNotice } from '@event-portal/ui';
import { createInlineClientUserAction, type CreateInlineClientUserState } from '../app/actions/group-user-actions';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';

type GroupUserOption = {
  value: string;
  username: string;
  email: string;
  label: string;
  searchText: string;
  helperText?: string;
};

type GroupUserLinkFieldProps = {
  label: string;
  name: string;
  defaultValue?: string[];
  options: GroupUserOption[];
  helperText?: string;
  language?: PortalLanguage;
};

const initialCreateState: CreateInlineClientUserState = {
  status: 'idle',
};

export function GroupUserLinkField(props: GroupUserLinkFieldProps) {
  const language = props.language ?? 'en';
  const copy = {
    searchPlaceholder: getPortalText(language, 'Search linked or available users by username or email', '按用戶名稱或電郵搜尋已連結或可選用戶'),
    searchAria: getPortalText(language, 'Search linked users', '搜尋已連結用戶'),
    createUser: getPortalText(language, 'Create user', '建立用戶'),
    selectedSummary: (count: number) =>
      getPortalText(language, count > 0 ? `${count} users selected` : 'No users selected', count > 0 ? `已選擇 ${count} 位用戶` : '未選擇任何用戶'),
    linkedUsers: getPortalText(language, 'Linked users', '已連結用戶'),
    username: getPortalText(language, 'Username', '用戶名稱'),
    email: getPortalText(language, 'Email', '電郵'),
    details: getPortalText(language, 'Details', '詳情'),
    action: getPortalText(language, 'Action', '操作'),
    remove: getPortalText(language, 'Remove', '移除'),
    noMatchLinked: getPortalText(language, 'No linked users match the current search.', '沒有已連結用戶符合目前搜尋。'),
    noLinked: getPortalText(language, 'No linked users selected.', '尚未選擇已連結用戶。'),
    noMatchingClientUsers: getPortalText(language, 'No matching client users.', '沒有符合的客戶用戶。'),
    newClientUser: getPortalText(language, 'New client user', '新建立的客戶用戶'),
    dialogTitle: getPortalText(language, 'Create Client User', '建立客戶用戶'),
    dialogDescription: getPortalText(language, 'This creates a `CLIENT_HR` user. Save the group form to link the new user to this group.', '此操作會建立 `CLIENT_HR` 用戶。請儲存群組表單，將新用戶連結到此群組。'),
    close: getPortalText(language, 'Close', '關閉'),
    createUserNotice: getPortalText(language, 'Create user', '建立用戶'),
    password: getPortalText(language, 'Password', '密碼'),
    status: getPortalText(language, 'Status', '狀態'),
    confirmed: getPortalText(language, 'Confirmed', '已確認'),
    yes: getPortalText(language, 'Yes', '是'),
    no: getPortalText(language, 'No', '否'),
  };
  const [selectedValues, setSelectedValues] = useState<string[]>(props.defaultValue ?? []);
  const [allOptions, setAllOptions] = useState<GroupUserOption[]>(props.options);
  const [query, setQuery] = useState('');
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const createFormRef = useRef<HTMLFormElement | null>(null);
  const [createState, createAction] = useActionState(createInlineClientUserAction, initialCreateState);

  useEffect(() => {
    setIsDialogMounted(true);
  }, []);

  useEffect(() => {
    setAllOptions(props.options);
  }, [props.options]);

  useEffect(() => {
    setSelectedValues(props.defaultValue ?? []);
  }, [props.defaultValue]);

  useEffect(() => {
    if (createState.status !== 'success' || !createState.user) {
      return;
    }

    const nextOption: GroupUserOption = {
      value: createState.user.documentId,
      username: createState.user.username,
      email: createState.user.email,
      label: `${createState.user.username} · ${createState.user.email}`,
      searchText: `${createState.user.username} ${createState.user.email} CLIENT_HR`,
      helperText: copy.newClientUser,
    };

    setAllOptions((current) => (current.some((option) => option.value === nextOption.value) ? current : [nextOption, ...current]));
    setSelectedValues((current) => (current.includes(nextOption.value) ? current : [...current, nextOption.value]));
    setQuery('');
    createFormRef.current?.reset();
    dialogRef.current?.close();
  }, [createState]);

  const selectedUsers = useMemo(
    () =>
      selectedValues
        .map((value) => allOptions.find((option) => option.value === value))
        .filter((option): option is GroupUserOption => Boolean(option)),
    [allOptions, selectedValues],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allOptions.filter((option) => {
      if (selectedValues.includes(option.value)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return option.searchText.toLowerCase().includes(normalizedQuery) || option.label.toLowerCase().includes(normalizedQuery);
    });
  }, [allOptions, query, selectedValues]);

  const filteredSelectedUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return selectedUsers;
    }

    return selectedUsers.filter(
      (user) => user.searchText.toLowerCase().includes(normalizedQuery) || user.label.toLowerCase().includes(normalizedQuery),
    );
  }, [query, selectedUsers]);

  function addUser(value: string) {
    setSelectedValues((current) => (current.includes(value) ? current : [...current, value]));
    setQuery('');
  }

  function removeUser(value: string) {
    setSelectedValues((current) => current.filter((item) => item !== value));
  }

  return (
    <label className="portal-field-full">
      <span className="portal-field-label">{props.label}</span>
      {props.helperText ? <p className="portal-helper-text">{props.helperText}</p> : null}
      <div className="portal-user-picker">
        <div className="portal-user-picker-toolbar">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchAria}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={() => dialogRef.current?.showModal()}>
            {copy.createUser}
          </button>
        </div>

        <div className="portal-selection-summary">
          {copy.selectedSummary(selectedUsers.length)}
        </div>

        <div className="portal-user-table-card">
          <div className="portal-user-table-heading">{copy.linkedUsers}</div>
          {selectedUsers.length > 0 ? (
            filteredSelectedUsers.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>{copy.username}</th>
                      <th>{copy.email}</th>
                      <th>{copy.details}</th>
                      <th>{copy.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSelectedUsers.map((user) => (
                      <tr key={user.value}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.helperText ?? '-'}</td>
                        <td>
                          <button type="button" className="btn btn-outline-secondary" onClick={() => removeUser(user.value)}>
                            {copy.remove}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="portal-empty-box">{copy.noMatchLinked}</div>
            )
          ) : (
            <div className="portal-empty-box">{copy.noLinked}</div>
          )}
        </div>

        <div className="portal-user-results">
          {filteredOptions.slice(0, 8).map((option) => (
            <button key={option.value} type="button" className="portal-user-option" onClick={() => addUser(option.value)}>
              <span>{option.label}</span>
              {option.helperText ? <small>{option.helperText}</small> : null}
            </button>
          ))}
          {filteredOptions.length === 0 ? <div className="portal-empty-box">{copy.noMatchingClientUsers}</div> : null}
        </div>
      </div>

      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={props.name} value={value} />
      ))}
      {isDialogMounted
        ? createPortal(
            <dialog ref={dialogRef} className="portal-dialog">
              <form ref={createFormRef} action={createAction} className="portal-dialog-form">
                <div className="portal-dialog-header">
                  <div>
                    <strong>{copy.dialogTitle}</strong>
                    <p>{copy.dialogDescription}</p>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => dialogRef.current?.close()}>
                    {copy.close}
                  </button>
                </div>

                {createState.status === 'error' && createState.message ? <InlineNotice title={copy.createUserNotice}>{createState.message}</InlineNotice> : null}

                <div className="portal-dialog-grid">
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.username}</span>
                    <input name="username" autoComplete="username" required />
                  </label>
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.email}</span>
                    <input name="email" type="email" autoComplete="email" required />
                  </label>
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.password}</span>
                    <input name="password" type="password" autoComplete="new-password" />
                  </label>
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.status}</span>
                    <select name="status" defaultValue="ACTIVE">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DISABLED">DISABLED</option>
                    </select>
                  </label>
                  <label className="portal-field">
                    <span className="portal-field-label">{copy.confirmed}</span>
                    <select name="confirmed" defaultValue="true">
                      <option value="true">{copy.yes}</option>
                      <option value="false">{copy.no}</option>
                    </select>
                  </label>
                </div>

                <div className="portal-dialog-actions">
                  <button type="submit" className="btn btn-primary">
                    {copy.createUser}
                  </button>
                </div>
              </form>
            </dialog>,
            document.body,
          )
        : null}
    </label>
  );
}
