'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { sendErpEnquiry } from '../lib/erp-api';
import { type ErpLanguage, isTraditionalChinese } from '../lib/erp-language';

export function EnquiryForm(props: { language: ErpLanguage }) {
  const isZh = isTraditionalChinese(props.language);
  const [mode, setMode] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await sendErpEnquiry(mode === 'EMAIL' ? { registeredEmail: value } : { mobileNumber: value });
      setMessage(
        result.accepted
          ? isZh
            ? '查詢已收到，系統會按你選擇的接收方式發送預約資料。'
            : 'Your enquiry has been received. We will send your booking information using the selected delivery method.'
          : isZh
            ? '輸入資料不正確，請檢查後再試。'
            : 'The information entered is invalid. Please check and try again.',
      );
    } catch {
      setMessage(isZh ? '暫時未能發送預約資料，請稍後再試。' : 'Unable to send booking information right now. Please try again later.');
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
          {isZh ? '以電郵接收' : 'Receive by email'}
        </button>
        <button
          type="button"
          onClick={() => setMode('SMS')}
          style={{ background: mode === 'SMS' ? '#174ea6' : '#eef5ff', color: mode === 'SMS' ? 'white' : '#174ea6' }}
        >
          {isZh ? '以短訊接收' : 'Receive by SMS'}
        </button>
      </div>

      <label>
        <div style={{ marginBottom: '6px', fontWeight: 600 }}>
          {mode === 'EMAIL'
            ? isZh
              ? '已登記工作電郵'
              : 'Registered work email'
            : isZh
              ? '已登記手機號碼'
              : 'Registered mobile number'}
        </div>
        <input
          type={mode === 'EMAIL' ? 'email' : 'text'}
          value={value}
          onChange={(event: any) => setValue(event.target.value)}
          placeholder={mode === 'EMAIL' ? 'employee@company.com' : isZh ? '例如：67180938' : '67180938'}
          required
        />
      </label>

      <button type="submit" style={{ background: '#174ea6', color: 'white', width: 'fit-content' }}>
        {isZh ? '發送預約資料' : 'Send booking information'}
      </button>

      {message ? (
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#eef5ff', color: '#174ea6' }}>
          {message}
        </div>
      ) : null}
    </form>
  );
}
