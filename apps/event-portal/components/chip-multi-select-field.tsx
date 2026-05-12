'use client';

import { useState } from 'react';
import { getPortalText, type PortalLanguage } from '../lib/portal-language';

type Option = {
  value: string;
  label: string;
};

type ChipMultiSelectFieldProps = {
  label: string;
  name: string;
  defaultValue?: string[];
  options: Option[];
  helperText?: string;
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  language?: PortalLanguage;
};

export function ChipMultiSelectField(props: ChipMultiSelectFieldProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(props.defaultValue ?? []);
  const language = props.language ?? 'en';
  const itemLabelSingular = props.itemLabelSingular ?? 'item';
  const itemLabelPlural = props.itemLabelPlural ?? `${itemLabelSingular}s`;

  function toggleValue(value: string) {
    setSelectedValues((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <label className="portal-field-full">
      <span className="portal-field-label">{props.label}</span>
      {props.helperText ? <p className="portal-helper-text">{props.helperText}</p> : null}
      <p className="portal-selection-summary">
        {selectedValues.length > 0
          ? getPortalText(
              language,
              `${selectedValues.length} ${selectedValues.length === 1 ? itemLabelSingular : itemLabelPlural} selected`,
              `已選擇 ${selectedValues.length} 個${itemLabelPlural}`,
            )
          : getPortalText(language, `No ${itemLabelPlural} selected`, `未選擇任何${itemLabelPlural}`)}
      </p>
      {props.options.length > 0 ? (
        <div className="portal-chip-list">
          {props.options.map((option) => {
            const selected = selectedValues.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                className={`portal-chip${selected ? ' is-selected' : ''}`}
                onClick={() => toggleValue(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty-box">{getPortalText(language, 'No options available.', '沒有可用選項。')}</div>
      )}
      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={props.name} value={value} />
      ))}
    </label>
  );
}
