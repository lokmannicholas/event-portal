'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { sendErpEnquiry } from '../lib/erp-api';

export function EnquiryForm() {
  const [mode, setMode] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await sendErpEnquiry(mode === 'EMAIL' ? { registeredEmail: value } : { mobileNumber: value });
      setMessage(result.message);
    } catch {
      setMessage('Unable to send booking information right now. Please try again later.');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', maxWidth: '520px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setMode('EMAIL')}
          style={{ background: mode === 'EMAIL' ? '#174ea6' : '#eef5ff', color: mode === 'EMAIL' ? 'white' : '#174ea6' }}
        >
          Receive by email
        </button>
        <button
          type="button"
          onClick={() => setMode('SMS')}
          style={{ background: mode === 'SMS' ? '#174ea6' : '#eef5ff', color: mode === 'SMS' ? 'white' : '#174ea6' }}
        >
          Receive by SMS
        </button>
      </div>

      <label>
        <div style={{ marginBottom: '6px', fontWeight: 600 }}>
          {mode === 'EMAIL' ? 'Registered work email' : 'Registered mobile number'}
        </div>
        <input
          type={mode === 'EMAIL' ? 'email' : 'text'}
          value={value}
          onChange={(event: any) => setValue(event.target.value)}
          placeholder={mode === 'EMAIL' ? 'employee@company.com' : '67180938'}
          required
        />
      </label>

      <button type="submit" style={{ background: '#174ea6', color: 'white', width: 'fit-content' }}>
        Send booking information
      </button>

      {message ? (
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#eef5ff', color: '#174ea6' }}>
          {message}
        </div>
      ) : null}
    </form>
  );
}
