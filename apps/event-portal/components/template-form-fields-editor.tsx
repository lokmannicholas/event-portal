'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { FieldType, FormFieldConfigDTO } from '@event-portal/contracts';

type EditableTemplateField = {
  id: string;
  fieldKey: string;
  labelEn: string;
  labelZh: string;
  fieldType: FieldType;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
  placeholderEn: string;
  placeholderZh: string;
  optionsText: string;
  isSystem: boolean;
};

const fieldTypeOptions: Array<{ value: FieldType; label: string }> = [
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Textarea' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Select' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'RADIO', label: 'Radio' },
];

function toEditableField(field: FormFieldConfigDTO, index: number): EditableTemplateField {
  return {
    id: `${field.fieldKey || 'field'}-${index}`,
    fieldKey: field.fieldKey,
    labelEn: field.labelEn,
    labelZh: field.labelZh ?? '',
    fieldType: field.fieldType,
    required: field.required,
    enabled: field.visibleInERP,
    sortOrder: field.sortOrder,
    placeholderEn: field.placeholderEn ?? '',
    placeholderZh: field.placeholderZh ?? '',
    optionsText: (field.options ?? []).join('\n'),
    isSystem: field.isSystem,
  };
}

function parseOptionsText(value: string) {
  return value
    .split('\n')
    .map((option) => option.trim())
    .filter(Boolean);
}

function parseDraftFields(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.map((field, index) => {
      const current = field as Partial<EditableTemplateField> & { options?: string[] };

      return {
        id: typeof current.id === 'string' && current.id ? current.id : `${current.fieldKey || 'field'}-${index}`,
        fieldKey: typeof current.fieldKey === 'string' ? current.fieldKey : '',
        labelEn: typeof current.labelEn === 'string' ? current.labelEn : '',
        labelZh: typeof current.labelZh === 'string' ? current.labelZh : '',
        fieldType: current.fieldType && fieldTypeOptions.some((option) => option.value === current.fieldType) ? current.fieldType : 'TEXT',
        required: Boolean(current.required),
        enabled: current.enabled !== false,
        sortOrder: typeof current.sortOrder === 'number' ? current.sortOrder : (index + 1) * 10,
        placeholderEn: typeof current.placeholderEn === 'string' ? current.placeholderEn : '',
        placeholderZh: typeof current.placeholderZh === 'string' ? current.placeholderZh : '',
        optionsText: Array.isArray(current.options) ? current.options.join('\n') : '',
        isSystem: Boolean(current.isSystem),
      } satisfies EditableTemplateField;
    });
  } catch {
    return undefined;
  }
}

export function TemplateFormFieldsEditor(props: { initialFields: FormFieldConfigDTO[]; initialFieldsJson?: string }) {
  const initialEditorFields: EditableTemplateField[] = parseDraftFields(props.initialFieldsJson) ?? props.initialFields.map(toEditableField);
  const [fields, setFields] = useState<EditableTemplateField[]>(initialEditorFields);

  function updateField(id: string, updater: (field: EditableTemplateField) => EditableTemplateField) {
    setFields((current) => current.map((field) => (field.id === id ? updater(field) : field)));
  }

  function removeField(id: string) {
    setFields((current) => current.filter((field) => field.id !== id));
  }

  function addField() {
    setFields((current) => [
      ...current,
      {
        id: `new-${Date.now()}-${current.length}`,
        fieldKey: '',
        labelEn: '',
        labelZh: '',
        fieldType: 'TEXT',
        required: false,
        enabled: true,
        sortOrder: (current.length + 1) * 10,
        placeholderEn: '',
        placeholderZh: '',
        optionsText: '',
        isSystem: false,
      },
    ]);
  }

  const serializedFields = JSON.stringify(
    fields.map(({ id: _id, optionsText, ...field }) => ({
      ...field,
      options: parseOptionsText(optionsText),
    })),
  );

  return (
    <div className="portal-stack" style={{ '--stack-gap': '12px' } as CSSProperties}>
      <input type="hidden" name="formFieldsJson" value={serializedFields} readOnly />
      {fields.map((field) => {
        const needsOptions = field.fieldType === 'SELECT' || field.fieldType === 'CHECKBOX' || field.fieldType === 'RADIO';

        return (
          <div key={field.id} className={`portal-builder-card${field.isSystem ? ' is-system' : ''}`}>
            <div className="portal-builder-header">
              <div>
                <div className="portal-builder-title">{field.isSystem ? 'Mandatory field' : 'Registration field'}</div>
                <div className="portal-inline-caption">
                  {field.isSystem ? 'Managed in Strapi and always enabled for ERP.' : 'Editable template field stored in formFields.'}
                </div>
              </div>
              {!field.isSystem ? (
                <button type="button" onClick={() => removeField(field.id)} className="btn-danger-link">
                  Remove
                </button>
              ) : null}
            </div>

            <div className="portal-builder-grid">
              <label className="portal-toggle-field">
                <span className="portal-field-label">Enabled in ERP</span>
                <span className="portal-checkbox-row">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    disabled={field.isSystem}
                    onChange={(event) => updateField(field.id, (current) => ({ ...current, enabled: event.target.checked }))}
                  />
                  <span>{field.enabled ? 'Visible' : 'Hidden'}</span>
                </span>
              </label>

              <label className="portal-toggle-field">
                <span className="portal-field-label">Required</span>
                <span className="portal-checkbox-row">
                  <input
                    type="checkbox"
                    checked={field.required}
                    disabled={field.isSystem}
                    onChange={(event) => updateField(field.id, (current) => ({ ...current, required: event.target.checked }))}
                  />
                  <span>{field.required ? 'Required' : 'Optional'}</span>
                </span>
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Sort order</span>
                <input
                  type="number"
                  value={field.sortOrder}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Field key</span>
                <input
                  value={field.fieldKey}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, fieldKey: event.target.value }))}
                  placeholder="employee_grade"
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Label (EN)</span>
                <input
                  value={field.labelEn}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, labelEn: event.target.value }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Label (ZH)</span>
                <input
                  value={field.labelZh}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, labelZh: event.target.value }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Field type</span>
                <select
                  value={field.fieldType}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, fieldType: event.target.value as FieldType }))}
                >
                  {fieldTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Placeholder (EN)</span>
                <input
                  value={field.placeholderEn}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, placeholderEn: event.target.value }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">Placeholder (ZH)</span>
                <input
                  value={field.placeholderZh}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, placeholderZh: event.target.value }))}
                />
              </label>
            </div>

            {needsOptions ? (
              <label className="portal-field-full" style={{ marginTop: '12px' }}>
                <span className="portal-field-label">Options</span>
                <textarea
                  value={field.optionsText}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, optionsText: event.target.value }))}
                  rows={4}
                  placeholder={'One option per line'}
                />
              </label>
            ) : null}
          </div>
        );
      })}

      <div>
        <button type="button" onClick={addField} className="btn btn-outline-secondary">
          Add field
        </button>
      </div>
    </div>
  );
}
