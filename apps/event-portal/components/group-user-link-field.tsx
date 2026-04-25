'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { InlineNotice } from '@flu-vax/ui';
import { createInlineClientUserAction, type CreateInlineClientUserState } from '../app/actions/group-user-actions';

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
};

const initialCreateState: CreateInlineClientUserState = {
  status: 'idle',
};

export function GroupUserLinkField(props: GroupUserLinkFieldProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(props.defaultValue ?? []);
  const [allOptions, setAllOptions] = useState<GroupUserOption[]>(props.options);
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const createFormRef = useRef<HTMLFormElement | null>(null);
  const [createState, createAction] = useFormState(createInlineClientUserAction, initialCreateState);

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
      helperText: 'New client user',
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
            placeholder="Search linked or available users by username or email"
            aria-label="Search linked users"
          />
          <button type="button" className="btn btn-outline-secondary" onClick={() => dialogRef.current?.showModal()}>
            Create user
          </button>
        </div>

        <div className="portal-selection-summary">
          {selectedUsers.length > 0 ? `${selectedUsers.length} users selected` : 'No users selected'}
        </div>

        <div className="portal-user-table-card">
          <div className="portal-user-table-heading">Linked users</div>
          {selectedUsers.length > 0 ? (
            filteredSelectedUsers.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Details</th>
                      <th>Action</th>
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
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="portal-empty-box">No linked users match the current search.</div>
            )
          ) : (
            <div className="portal-empty-box">No linked users selected.</div>
          )}
        </div>

        <div className="portal-user-results">
          {filteredOptions.slice(0, 8).map((option) => (
            <button key={option.value} type="button" className="portal-user-option" onClick={() => addUser(option.value)}>
              <span>{option.label}</span>
              {option.helperText ? <small>{option.helperText}</small> : null}
            </button>
          ))}
          {filteredOptions.length === 0 ? <div className="portal-empty-box">No matching client users.</div> : null}
        </div>
      </div>

      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={props.name} value={value} />
      ))}

      <dialog ref={dialogRef} className="portal-dialog">
        <form ref={createFormRef} action={createAction} className="portal-dialog-form">
          <div className="portal-dialog-header">
            <div>
              <strong>Create Client User</strong>
              <p>This creates a `CLIENT_HR` user. Save the group form to link the new user to this group.</p>
            </div>
            <button type="button" className="btn btn-outline-secondary" onClick={() => dialogRef.current?.close()}>
              Close
            </button>
          </div>

          {createState.status === 'error' && createState.message ? <InlineNotice title="Create user">{createState.message}</InlineNotice> : null}

          <div className="portal-dialog-grid">
            <label className="portal-field">
              <span className="portal-field-label">Username</span>
              <input name="username" required />
            </label>
            <label className="portal-field">
              <span className="portal-field-label">Email</span>
              <input name="email" type="email" required />
            </label>
            <label className="portal-field">
              <span className="portal-field-label">Password</span>
              <input name="password" type="password" />
            </label>
            <label className="portal-field">
              <span className="portal-field-label">Status</span>
              <select name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </label>
            <label className="portal-field">
              <span className="portal-field-label">Confirmed</span>
              <select name="confirmed" defaultValue="true">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>

          <div className="portal-dialog-actions">
            <button type="submit" className="btn btn-primary">
              Create user
            </button>
          </div>
        </form>
      </dialog>
    </label>
  );
}
