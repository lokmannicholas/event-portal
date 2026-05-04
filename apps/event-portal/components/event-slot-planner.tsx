'use client';

import { useEffect, useState } from 'react';
import type { EventDateDTO } from '@event-portal/contracts';
import type { EventPortalEventSlotPayload } from '../lib/event-portal-types';

type SlotRow = {
  id: string;
  documentId?: string;
  date: string;
  startTime: string;
  endTime: string;
  quota: number;
  usedCount: number;
  holdCount: number;
  remaining: number;
  enabled: boolean;
};

type SlotPlanDraftRow = {
  id?: string;
  documentId?: string;
  date?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  quota?: number;
  usedCount?: number;
  holdCount?: number;
  enabled?: boolean;
};

function normalizeTimeValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(trimmed)) {
    return trimmed.slice(0, 8);
  }

  return trimmed;
}

function toInputDateTime(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(
    value.getHours(),
  ).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function buildDefaultRange() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);

  const end = new Date(start);
  end.setHours(12, 0, 0, 0);

  return {
    start: toInputDateTime(start),
    end: toInputDateTime(end),
  };
}

function formatSlotLabel(row: SlotRow) {
  return `${row.date} ${row.startTime} - ${row.endTime}`;
}

function sortSlotRows(rows: SlotRow[]) {
  return rows.slice().sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const startCompare = left.startTime.localeCompare(right.startTime);

    if (startCompare !== 0) {
      return startCompare;
    }

    return left.endTime.localeCompare(right.endTime);
  });
}

function buildRowsFromDates(dates: EventDateDTO[]): SlotRow[] {
  return dates.flatMap((date, dateIndex) =>
    date.slots.map((slot, slotIndex) => ({
      id: slot.documentId || `ts_${dateIndex + 1}_${slotIndex + 1}`,
      documentId: slot.documentId,
      date: date.date,
      startTime: normalizeTimeValue(slot.startTime),
      endTime: normalizeTimeValue(slot.endTime),
      quota: slot.quota,
      usedCount: slot.usedCount,
      holdCount: slot.holdCount,
      remaining: slot.remaining,
      enabled: slot.enabled && date.enabled,
    })),
  );
}

function buildRowsFromDraft(value: string | undefined): SlotRow[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed
      .filter((row): row is SlotPlanDraftRow => typeof row === 'object' && row !== null)
      .map((row, index) => {
        const quota = Number(row.quota ?? 0);
        const usedCount = Number(row.usedCount ?? 0);
        const holdCount = Number(row.holdCount ?? 0);

        return {
          id: row.id || row.documentId || `draft_${index + 1}`,
          documentId: row.documentId,
          date: row.eventDate ?? row.date ?? '',
          startTime: normalizeTimeValue(row.startTime ?? ''),
          endTime: normalizeTimeValue(row.endTime ?? ''),
          quota,
          usedCount,
          holdCount,
          remaining: Math.max(quota - usedCount - holdCount, 0),
          enabled: row.enabled !== false,
        };
      })
      .filter((row) => row.date && row.startTime && row.endTime);
  } catch {
    return undefined;
  }
}

export function EventSlotPlanner(props: {
  name?: string;
  initialDates?: EventDateDTO[];
  initialDraftJson?: string;
  defaultQuota?: number;
  defaultDurationMinutes?: number;
}) {
  const defaults = buildDefaultRange();
  const initialRows: SlotRow[] = buildRowsFromDraft(props.initialDraftJson) ?? buildRowsFromDates(props.initialDates ?? []);
  const [generateStart, setGenerateStart] = useState(defaults.start);
  const [generateEnd, setGenerateEnd] = useState(defaults.end);
  const [intervalMinutes, setIntervalMinutes] = useState(props.defaultDurationMinutes ?? 30);
  const [baseQuota, setBaseQuota] = useState(props.defaultQuota ?? 10);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<SlotRow[]>(initialRows);

  useEffect(() => {
    setRows(buildRowsFromDraft(props.initialDraftJson) ?? buildRowsFromDates(props.initialDates ?? []));
  }, [props.initialDates, props.initialDraftJson]);

  function handleGenerate() {
    const start = generateStart ? new Date(generateStart) : new Date(`${defaults.start}:00`);
    const end = generateEnd ? new Date(generateEnd) : new Date(`${defaults.end}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setMessage('Start and end time must be valid ISO timestamps, and end must be later than start.');
      return;
    }

    if (intervalMinutes <= 0) {
      setMessage('Interval must be greater than zero.');
      return;
    }

    const generated: SlotRow[] = [];
    let index = 101;
    const cursor = new Date(start);

    while (cursor < end) {
      const slotEnd = new Date(cursor.getTime() + intervalMinutes * 60 * 1000);
      if (slotEnd > end) {
        break;
      }

      generated.push({
        id: `ts_${index}`,
        date: cursor.toISOString().slice(0, 10),
        startTime: `${String(cursor.getHours()).padStart(2, '0')}:${String(cursor.getMinutes()).padStart(2, '0')}:00`,
        endTime: `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}:00`,
        quota: baseQuota,
        usedCount: 0,
        holdCount: 0,
        remaining: baseQuota,
        enabled: true,
      });

      cursor.setTime(slotEnd.getTime());
      index += 1;
    }

    setRows(generated);
    setMessage(generated.length > 0 ? `Generated ${generated.length} timeslots. You can adjust quota per row before saving.` : 'No timeslots were generated.');
  }

  function updateRow(id: string, patch: Partial<SlotRow>) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const next = { ...row, ...patch };
        const remaining = Math.max(next.quota - next.usedCount - next.holdCount, 0);
        return { ...next, remaining };
      }),
    );
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  const sortedRows = sortSlotRows(rows);
  const serialized = JSON.stringify(
    sortedRows.map<EventPortalEventSlotPayload>((row) => ({
      documentId: row.documentId,
      eventDate: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      enabled: row.enabled,
      quota: row.quota,
      usedCount: row.usedCount,
      holdCount: row.holdCount,
    })),
  );

  return (
    <div className="portal-stack">
      <input type="hidden" name={props.name ?? 'slotPlanJson'} value={serialized} />

      <div className="portal-panel portal-panel-soft">
        <h3>Auto Generate Timeslots</h3>
        <div className="portal-field-grid">
          <label className="portal-field">
            <span className="portal-field-label">Start time (ISO)</span>
            <input type="datetime-local" value={generateStart} onChange={(event) => setGenerateStart(event.target.value)} />
          </label>
          <label className="portal-field">
            <span className="portal-field-label">End time (ISO)</span>
            <input type="datetime-local" value={generateEnd} onChange={(event) => setGenerateEnd(event.target.value)} />
          </label>
          <label className="portal-field">
            <span className="portal-field-label">Interval (minutes)</span>
            <input type="number" min={5} step={5} value={intervalMinutes} onChange={(event) => setIntervalMinutes(Number(event.target.value))} />
          </label>
          <label className="portal-field">
            <span className="portal-field-label">Base quota</span>
            <input type="number" min={1} value={baseQuota} onChange={(event) => setBaseQuota(Number(event.target.value))} />
          </label>
        </div>
        <div className="portal-toolbar" style={{ marginTop: '14px' }}>
          <div className="portal-card-caption">
            Leave the defaults to generate a quick sample. Each timeslot quota can still be edited individually below.
          </div>
          <button type="button" onClick={handleGenerate} className="btn btn-primary">
            Generate
          </button>
        </div>
        {message ? <div className="portal-selection-summary" style={{ marginTop: '12px' }}>{message}</div> : null}
      </div>

      <div className="portal-table-panel">
        <h3>Timeslot List</h3>
        {rows.length === 0 ? (
          <div className="portal-card-caption">No timeslots yet. Generate a range above to build the event schedule.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Quota</th>
                  <th>Used</th>
                  <th>Held</th>
                  <th>Remaining</th>
                  <th>Enabled</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatSlotLabel(row)}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={row.quota}
                        onChange={(event) => updateRow(row.id, { quota: Number(event.target.value) })}
                        style={{ width: '90px' }}
                      />
                    </td>
                    <td>{row.usedCount}</td>
                    <td>{row.holdCount}</td>
                    <td>{row.remaining}</td>
                    <td>
                      <input type="checkbox" checked={row.enabled} onChange={(event) => updateRow(row.id, { enabled: event.target.checked })} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => removeRow(row.id)}
                        aria-label={`Remove timeslot ${formatSlotLabel(row)}`}
                        title="Remove timeslot"
                        style={{ padding: '0.45rem 0.55rem', lineHeight: 0 }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path
                            d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12l1-13H5l1 13Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
