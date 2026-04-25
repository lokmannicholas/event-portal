import type { FieldType, FormFieldConfigDTO } from '@flu-vax/contracts';
import type { EventPortalFieldConfigComponent } from './event-portal-types';

export type TemplateFieldFormValue = {
  fieldKey?: string;
  labelEn?: string;
  labelZh?: string;
  fieldType?: FieldType;
  required?: boolean;
  enabled?: boolean;
  sortOrder?: number;
  placeholderEn?: string;
  placeholderZh?: string;
  options?: string[];
};

const supportedFieldTypes: FieldType[] = ['TEXT', 'TEXTAREA', 'EMAIL', 'MOBILE', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX', 'RADIO'];

function trimToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeFieldType(fieldType: FieldType | undefined): FieldType {
  return supportedFieldTypes.includes(fieldType ?? 'TEXT') ? (fieldType ?? 'TEXT') : 'TEXT';
}

function normalizeOptions(options: string[] | undefined) {
  if (!Array.isArray(options)) {
    return undefined;
  }

  const values = Array.from(new Set(options.map((option) => option.trim()).filter(Boolean)));
  return values.length > 0 ? values : undefined;
}

function normalizeSortOrder(sortOrder: number | undefined, fallback: number) {
  return Number.isFinite(sortOrder) ? Number(sortOrder) : fallback;
}

export function mergeTemplateFields(mandatoryFields: FormFieldConfigDTO[], templateFields: FormFieldConfigDTO[] = []): FormFieldConfigDTO[] {
  const templateFieldByKey = new Map(templateFields.map((field) => [field.fieldKey, field]));
  const mandatoryFieldKeys = new Set(mandatoryFields.map((field) => field.fieldKey));

  const mergedMandatoryFields = mandatoryFields.map((field) => {
    const currentField = templateFieldByKey.get(field.fieldKey);

    return {
      ...field,
      required: field.required,
      visibleInERP: true,
      visibleInECP: currentField?.visibleInECP ?? field.visibleInECP,
      visibleInEAP: currentField?.visibleInEAP ?? field.visibleInEAP,
      sortOrder: currentField?.sortOrder ?? field.sortOrder,
      isSystem: true,
      placeholderEn: field.placeholderEn ?? currentField?.placeholderEn,
      placeholderZh: field.placeholderZh ?? currentField?.placeholderZh,
      options: field.options ?? currentField?.options,
    };
  });

  const editableFields = templateFields
    .filter((field) => !mandatoryFieldKeys.has(field.fieldKey))
    .map((field) => ({
      ...field,
      isSystem: false,
    }));

  return [...mergedMandatoryFields, ...editableFields].sort((left, right) => left.sortOrder - right.sortOrder);
}

export function normalizeTemplateFields(
  formFields: TemplateFieldFormValue[],
  mandatoryFields: FormFieldConfigDTO[],
): EventPortalFieldConfigComponent[] {
  const normalizedMandatoryFields = mandatoryFields.map((field, index) => ({
    fieldKey: field.fieldKey,
    labelEn: field.labelEn,
    labelZh: field.labelZh,
    fieldType: field.fieldType,
    required: field.required,
    visibleInErp: true,
    visibleInEcp: field.visibleInECP,
    visibleInEap: field.visibleInEAP,
    sortOrder: normalizeSortOrder(field.sortOrder, (index + 1) * 10),
    isSystem: true,
    placeholderEn: field.placeholderEn,
    placeholderZh: field.placeholderZh,
    optionsJson: field.options,
  }));

  const mandatoryFieldKeys = new Set(mandatoryFields.map((field) => field.fieldKey));
  const seenKeys = new Set(mandatoryFieldKeys);

  const normalizedCustomFields = formFields
    .map((field, index) => ({
      fieldKey: field.fieldKey?.trim() ?? '',
      labelEn: field.labelEn?.trim() ?? '',
      labelZh: trimToUndefined(field.labelZh),
      fieldType: normalizeFieldType(field.fieldType),
      required: Boolean(field.required),
      visibleInErp: Boolean(field.enabled),
      visibleInEcp: false,
      visibleInEap: false,
      sortOrder: normalizeSortOrder(field.sortOrder, (index + mandatoryFields.length + 1) * 10),
      isSystem: false,
      placeholderEn: trimToUndefined(field.placeholderEn),
      placeholderZh: trimToUndefined(field.placeholderZh),
      optionsJson: normalizeOptions(field.options),
    }))
    .filter((field) => field.fieldKey && field.labelEn && !mandatoryFieldKeys.has(field.fieldKey))
    .filter((field) => {
      if (seenKeys.has(field.fieldKey)) {
        return false;
      }

      seenKeys.add(field.fieldKey);
      return true;
    });

  return [...normalizedMandatoryFields, ...normalizedCustomFields].sort((left, right) => left.sortOrder - right.sortOrder);
}
