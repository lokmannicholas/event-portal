'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { FieldType, FormFieldConfigDTO } from '@event-portal/contracts';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';

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

export function TemplateFormFieldsEditor(props: { initialFields: FormFieldConfigDTO[]; initialFieldsJson?: string; language?: PortalLanguage }) {
  const language = props.language ?? 'en';
  const copy = {
    mandatoryField: getPortalText(language, 'Mandatory field', '必填欄位'),
    registrationField: getPortalText(language, 'Registration field', '登記欄位'),
    mandatoryHelper: getPortalText(language, 'Managed in Strapi and always enabled for ERP.', '由 Strapi 管理，並會一直於 ERP 啟用。'),
    editableHelper: getPortalText(language, 'Editable template field stored in formFields.', '可編輯的模板欄位，儲存在 formFields。'),
    remove: getPortalText(language, 'Remove', '移除'),
    enabledInErp: getPortalText(language, 'Enabled in ERP', '於 ERP 啟用'),
    visible: getPortalText(language, 'Visible', '顯示'),
    hidden: getPortalText(language, 'Hidden', '隱藏'),
    required: getPortalText(language, 'Required', '必填'),
    requiredState: getPortalText(language, 'Required', '必填'),
    optionalState: getPortalText(language, 'Optional', '選填'),
    sortOrder: getPortalText(language, 'Sort order', '排序'),
    fieldKey: getPortalText(language, 'Field key', '欄位鍵值'),
    labelEn: getPortalText(language, 'Label (EN)', '標籤（英文）'),
    labelZh: getPortalText(language, 'Label (ZH)', '標籤（中文）'),
    fieldType: getPortalText(language, 'Field type', '欄位類型'),
    placeholderEn: getPortalText(language, 'Placeholder (EN)', '提示文字（英文）'),
    placeholderZh: getPortalText(language, 'Placeholder (ZH)', '提示文字（中文）'),
    options: getPortalText(language, 'Options', '選項'),
    optionsPlaceholder: getPortalText(language, 'One option per line', '每行一個選項'),
    addField: getPortalText(language, 'Add field', '新增欄位'),
  };
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
                <div className="portal-builder-title">{field.isSystem ? copy.mandatoryField : copy.registrationField}</div>
                <div className="portal-inline-caption">
                  {field.isSystem ? copy.mandatoryHelper : copy.editableHelper}
                </div>
              </div>
              {!field.isSystem ? (
                <button type="button" onClick={() => removeField(field.id)} className="btn-danger-link">
                  {copy.remove}
                </button>
              ) : null}
            </div>

            <div className="portal-builder-grid">
              <label className="portal-toggle-field">
                <span className="portal-field-label">{copy.enabledInErp}</span>
                <span className="portal-checkbox-row">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    disabled={field.isSystem}
                    onChange={(event) => updateField(field.id, (current) => ({ ...current, enabled: event.target.checked }))}
                  />
                  <span>{field.enabled ? copy.visible : copy.hidden}</span>
                </span>
              </label>

              <label className="portal-toggle-field">
                <span className="portal-field-label">{copy.required}</span>
                <span className="portal-checkbox-row">
                  <input
                    type="checkbox"
                    checked={field.required}
                    disabled={field.isSystem}
                    onChange={(event) => updateField(field.id, (current) => ({ ...current, required: event.target.checked }))}
                  />
                  <span>{field.required ? copy.requiredState : copy.optionalState}</span>
                </span>
              </label>

              <label className="portal-field">
                <span className="portal-field-label">{copy.sortOrder}</span>
                <input
                  type="number"
                  value={field.sortOrder}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">{copy.fieldKey}</span>
                <input
                  value={field.fieldKey}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, fieldKey: event.target.value }))}
                  placeholder="employee_grade"
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">{copy.labelEn}</span>
                <input
                  value={field.labelEn}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, labelEn: event.target.value }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">{copy.labelZh}</span>
                <input
                  value={field.labelZh}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, labelZh: event.target.value }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">{copy.fieldType}</span>
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
                <span className="portal-field-label">{copy.placeholderEn}</span>
                <input
                  value={field.placeholderEn}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, placeholderEn: event.target.value }))}
                />
              </label>

              <label className="portal-field">
                <span className="portal-field-label">{copy.placeholderZh}</span>
                <input
                  value={field.placeholderZh}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, placeholderZh: event.target.value }))}
                />
              </label>
            </div>

            {needsOptions ? (
              <label className="portal-field-full" style={{ marginTop: '12px' }}>
                <span className="portal-field-label">{copy.options}</span>
                <textarea
                  value={field.optionsText}
                  disabled={field.isSystem}
                  onChange={(event) => updateField(field.id, (current) => ({ ...current, optionsText: event.target.value }))}
                  rows={4}
                  placeholder={copy.optionsPlaceholder}
                />
              </label>
            ) : null}
          </div>
        );
      })}

      <div>
        <button type="button" onClick={addField} className="btn btn-outline-secondary">
          {copy.addField}
        </button>
      </div>
    </div>
  );
}
