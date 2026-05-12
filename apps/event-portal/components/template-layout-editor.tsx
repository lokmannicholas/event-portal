'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import type {
  FormFieldConfigDTO,
  TemplateLayoutColorSettingsDTO,
  TemplateLayoutFieldColumn,
  TemplateLayoutFieldPositionDTO,
  TemplateLayoutSettingsDTO,
  TemplateTitlePosition,
} from '@event-portal/contracts';
import { normalizeTemplateLayoutSettings, resolveTemplateLayoutSettings } from '../lib/template-layout';

const FIELD_COLUMNS: Array<{ key: TemplateLayoutFieldColumn; label: string; helper: string }> = [
  { key: 'left', label: 'Left column', helper: 'Use for standard half-width fields.' },
  { key: 'right', label: 'Right column', helper: 'Drop another field beside the left column.' },
  { key: 'full', label: 'Full width', helper: 'Use for long answers or standout rows.' },
];

const COLOR_FIELDS: Array<{ key: keyof TemplateLayoutColorSettingsDTO; label: string; fallback: string }> = [
  { key: 'pageBackground', label: 'Page background', fallback: '#f3f7fb' },
  { key: 'surfaceBackground', label: 'Card background', fallback: '#ffffff' },
  { key: 'surfaceBorderColor', label: 'Card border', fallback: '#d7e3ec' },
  { key: 'accentColor', label: 'Accent color', fallback: '#0f6b74' },
  { key: 'headingColor', label: 'Heading color', fallback: '#12303a' },
  { key: 'bodyTextColor', label: 'Body text', fallback: '#49616b' },
  { key: 'fieldBackground', label: 'Field background', fallback: '#fdfefe' },
  { key: 'fieldBorderColor', label: 'Field border', fallback: '#c5d6e2' },
  { key: 'buttonBackground', label: 'Primary button', fallback: '#0f6b74' },
  { key: 'buttonTextColor', label: 'Button text', fallback: '#ffffff' },
];

type LayoutEditorField = {
  fieldKey: string;
  label: string;
  required: boolean;
  visibleInERP: boolean;
};

function buildEditorFields(fields: FormFieldConfigDTO[]): LayoutEditorField[] {
  return Array.from(
    new Map(
      fields
        .filter((field) => field.fieldKey.trim())
        .map((field) => [
          field.fieldKey,
          {
            fieldKey: field.fieldKey,
            label: field.labelEn || field.fieldKey,
            required: field.required,
            visibleInERP: field.visibleInERP,
          } satisfies LayoutEditorField,
        ]),
    ).values(),
  );
}

function sortPositions(positions: TemplateLayoutFieldPositionDTO[]) {
  return positions.slice().sort((left, right) => {
    if (left.column !== right.column) {
      return FIELD_COLUMNS.findIndex((column) => column.key === left.column) - FIELD_COLUMNS.findIndex((column) => column.key === right.column);
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.fieldKey.localeCompare(right.fieldKey);
  });
}

function resequencePositions(positions: TemplateLayoutFieldPositionDTO[]) {
  const next: TemplateLayoutFieldPositionDTO[] = [];

  for (const column of FIELD_COLUMNS) {
    const items = sortPositions(positions.filter((position) => position.column === column.key));
    items.forEach((item, index) => {
      next.push({
        ...item,
        order: (index + 1) * 10,
      });
    });
  }

  return next;
}

function getPreviewStyles(colors: TemplateLayoutColorSettingsDTO) {
  return {
    shell: {
      background: colors.pageBackground || '#f3f7fb',
      color: colors.bodyTextColor || '#49616b',
    } satisfies CSSProperties,
    surface: {
      background: colors.surfaceBackground || '#ffffff',
      borderColor: colors.surfaceBorderColor || '#d7e3ec',
      color: colors.bodyTextColor || '#49616b',
    } satisfies CSSProperties,
    heading: {
      color: colors.headingColor || '#12303a',
    } satisfies CSSProperties,
    accent: {
      color: colors.accentColor || '#0f6b74',
    } satisfies CSSProperties,
    field: {
      background: colors.fieldBackground || '#fdfefe',
      borderColor: colors.fieldBorderColor || '#c5d6e2',
      color: colors.bodyTextColor || '#49616b',
    } satisfies CSSProperties,
    button: {
      background: colors.buttonBackground || '#0f6b74',
      color: colors.buttonTextColor || '#ffffff',
      borderColor: colors.buttonBackground || '#0f6b74',
    } satisfies CSSProperties,
  };
}

function getColorInputValue(value: string | undefined, fallback: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value ?? '') ? value! : fallback;
}

export function TemplateLayoutEditor(props: {
  initialFields: FormFieldConfigDTO[];
  initialLayoutSettings?: TemplateLayoutSettingsDTO;
  initialCustomCss?: string;
}) {
  const editorFields = buildEditorFields(props.initialFields);
  const fieldKeys = editorFields.map((field) => field.fieldKey);
  const resolvedLayout = resolveTemplateLayoutSettings(fieldKeys, props.initialLayoutSettings);
  const [titlePosition, setTitlePosition] = useState<TemplateTitlePosition>(resolvedLayout.titlePosition);
  const [positions, setPositions] = useState<TemplateLayoutFieldPositionDTO[]>(resolvedLayout.fieldPositions);
  const [colors, setColors] = useState<TemplateLayoutColorSettingsDTO>(resolvedLayout.colors);
  const [customCss, setCustomCss] = useState(props.initialCustomCss ?? '');
  const [draggingFieldKey, setDraggingFieldKey] = useState<string | null>(null);

  const normalizedSettings =
    normalizeTemplateLayoutSettings(fieldKeys, {
      titlePosition,
      fieldPositions: positions,
      colors,
    }) ?? undefined;
  const serializedSettings = normalizedSettings ? JSON.stringify(normalizedSettings) : '';
  const previewStyles = getPreviewStyles(colors);

  function moveField(fieldKey: string, column: TemplateLayoutFieldColumn, targetIndex?: number) {
    setPositions((current) => {
      const nextByColumn = new Map<TemplateLayoutFieldColumn, TemplateLayoutFieldPositionDTO[]>(
        FIELD_COLUMNS.map((item) => [item.key, sortPositions(current.filter((position) => position.column === item.key))]),
      );
      const currentPosition = current.find((position) => position.fieldKey === fieldKey) ?? {
        fieldKey,
        column,
        order: 10,
      };

      for (const columnGroup of FIELD_COLUMNS) {
        nextByColumn.set(
          columnGroup.key,
          (nextByColumn.get(columnGroup.key) ?? []).filter((position) => position.fieldKey !== fieldKey),
        );
      }

      const targetList = nextByColumn.get(column) ?? [];
      const nextPosition = Math.max(0, Math.min(targetIndex ?? targetList.length, targetList.length));
      targetList.splice(nextPosition, 0, {
        ...currentPosition,
        column,
      });
      nextByColumn.set(column, targetList);

      return resequencePositions(FIELD_COLUMNS.flatMap((columnGroup) => nextByColumn.get(columnGroup.key) ?? []));
    });
  }

  function resetLayout() {
    const defaults = resolveTemplateLayoutSettings(fieldKeys, undefined);
    setTitlePosition(defaults.titlePosition);
    setPositions(defaults.fieldPositions);
    setColors({});
    setCustomCss('');
  }

  return (
    <div className="portal-stack" style={{ '--stack-gap': '16px' } as CSSProperties}>
      <input type="hidden" name="layoutSettingsJson" value={serializedSettings} readOnly />

      <div className="portal-layout-toolbar">
        <label className="portal-field">
          <span className="portal-field-label">Title position</span>
          <select value={titlePosition} onChange={(event) => setTitlePosition(event.target.value as TemplateTitlePosition)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>

        <div className="portal-layout-toolbar-actions">
          <div className="portal-inline-caption">Drag cards between lanes to control the ERP field layout.</div>
          <button type="button" className="btn btn-outline-secondary" onClick={resetLayout}>
            Reset to default
          </button>
        </div>
      </div>

      <div className="portal-layout-board">
        {FIELD_COLUMNS.map((column) => {
          const columnItems = sortPositions(positions.filter((position) => position.column === column.key))
            .map((position) => editorFields.find((field) => field.fieldKey === position.fieldKey))
            .filter((field): field is LayoutEditorField => Boolean(field));

          return (
            <section
              key={column.key}
              className="portal-layout-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();

                if (draggingFieldKey) {
                  moveField(draggingFieldKey, column.key);
                  setDraggingFieldKey(null);
                }
              }}
            >
              <div className="portal-layout-column-header">
                <strong>{column.label}</strong>
                <span>{column.helper}</span>
              </div>

              <div className="portal-layout-column-body">
                {columnItems.map((field, index) => (
                  <div
                    key={field.fieldKey}
                    className={`portal-layout-card${draggingFieldKey === field.fieldKey ? ' is-dragging' : ''}${field.visibleInERP ? '' : ' is-muted'}`}
                    draggable
                    onDragStart={() => setDraggingFieldKey(field.fieldKey)}
                    onDragEnd={() => setDraggingFieldKey(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();

                      if (draggingFieldKey) {
                        moveField(draggingFieldKey, column.key, index);
                        setDraggingFieldKey(null);
                      }
                    }}
                  >
                    <div className="portal-layout-card-copy">
                      <strong>{field.label}</strong>
                      <span>{field.fieldKey}</span>
                    </div>
                    <div className="portal-layout-card-meta">
                      {field.required ? <span className="portal-layout-pill">Required</span> : null}
                      {!field.visibleInERP ? <span className="portal-layout-pill is-muted">Hidden in ERP</span> : null}
                    </div>
                    <div className="portal-layout-card-actions">
                      {FIELD_COLUMNS.map((target) => (
                        <button
                          key={target.key}
                          type="button"
                          className={`portal-layout-mini-button${target.key === column.key ? ' is-active' : ''}`}
                          onClick={() => moveField(field.fieldKey, target.key)}
                        >
                          {target.key === 'full' ? 'Full' : target.key === 'left' ? 'Left' : 'Right'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="portal-layout-dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();

                    if (draggingFieldKey) {
                      moveField(draggingFieldKey, column.key);
                      setDraggingFieldKey(null);
                    }
                  }}
                >
                  Drop field here
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <div className="portal-layout-color-grid">
        {COLOR_FIELDS.map((field) => (
          <label key={field.key} className="portal-layout-color-field">
            <span className="portal-field-label">{field.label}</span>
            <div className="portal-layout-color-input">
              <input
                type="color"
                value={getColorInputValue(colors[field.key], field.fallback)}
                onChange={(event) => setColors((current) => ({ ...current, [field.key]: event.target.value }))}
              />
              <input
                value={colors[field.key] ?? ''}
                onChange={(event) =>
                  setColors((current) => ({
                    ...current,
                    [field.key]: event.target.value.trim() || undefined,
                  }))
                }
                placeholder={`Default ${field.fallback}`}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setColors((current) => ({
                    ...current,
                    [field.key]: undefined,
                  }))
                }
              >
                Clear
              </button>
            </div>
          </label>
        ))}
      </div>

      <label className="portal-field-full">
        <span className="portal-field-label">Custom CSS</span>
        <textarea
          name="customCss"
          value={customCss}
          onChange={(event) => setCustomCss(event.target.value)}
          rows={10}
          placeholder=".erp-booking-banner { border-radius: 40px; }"
        />
      </label>

      <section className="portal-layout-preview" style={previewStyles.shell}>
        <div className="portal-layout-preview-surface" style={previewStyles.surface}>
          <div className={`portal-layout-preview-title is-${titlePosition}`} style={previewStyles.heading}>
            <span style={previewStyles.accent}>Preview</span>
            <h4>Vaccination Booking Registration</h4>
            <p>This preview follows the saved template field positions, title alignment, and color overrides.</p>
          </div>

          <div className="portal-layout-preview-grid">
            {FIELD_COLUMNS.map((column) => {
              const columnItems = sortPositions(positions.filter((position) => position.column === column.key))
                .map((position) => editorFields.find((field) => field.fieldKey === position.fieldKey))
                .filter((field): field is LayoutEditorField => Boolean(field));

              if (columnItems.length === 0) {
                return null;
              }

              return (
                <div key={column.key} className={`portal-layout-preview-column is-${column.key}`}>
                  {columnItems.map((field) => (
                    <div key={field.fieldKey} className="portal-layout-preview-field" style={previewStyles.field}>
                      <strong style={previewStyles.heading}>{field.label}</strong>
                      <span>{field.required ? 'Required field' : 'Optional field'}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="portal-layout-preview-actions">
            <button type="button" style={previewStyles.button}>
              Confirm submission
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
