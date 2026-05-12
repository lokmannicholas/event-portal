import type {
  TemplateLayoutColorSettingsDTO,
  TemplateLayoutFieldColumn,
  TemplateLayoutFieldPositionDTO,
  TemplateLayoutSettingsDTO,
  TemplateTitlePosition,
} from '@event-portal/contracts';

const FIELD_COLUMNS: TemplateLayoutFieldColumn[] = ['left', 'right', 'full'];
const TITLE_POSITIONS: TemplateTitlePosition[] = ['left', 'center', 'right'];
const COLOR_KEYS = [
  'pageBackground',
  'surfaceBackground',
  'surfaceBorderColor',
  'accentColor',
  'headingColor',
  'bodyTextColor',
  'fieldBackground',
  'fieldBorderColor',
  'buttonBackground',
  'buttonTextColor',
] as const;

type TemplateLayoutColorKey = (typeof COLOR_KEYS)[number];

export type ResolvedTemplateLayoutSettings = {
  titlePosition: TemplateTitlePosition;
  fieldPositions: TemplateLayoutFieldPositionDTO[];
  colors: TemplateLayoutColorSettingsDTO;
  isCustomized: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function trimToUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getNormalizedFieldKeys(fieldKeys: string[]) {
  return Array.from(
    new Set(
      fieldKeys
        .map((fieldKey) => fieldKey.trim())
        .filter(Boolean),
    ),
  );
}

function getColorSettings(value: unknown): TemplateLayoutColorSettingsDTO {
  if (!isRecord(value)) {
    return {};
  }

  const colors: TemplateLayoutColorSettingsDTO = {};

  for (const key of COLOR_KEYS) {
    const current = trimToUndefined(value[key]);

    if (current) {
      colors[key] = current;
    }
  }

  return colors;
}

function hasAnyColorValue(colors: TemplateLayoutColorSettingsDTO) {
  return COLOR_KEYS.some((key) => Boolean(colors[key]));
}

function getDefaultFieldPositionMap(fieldKeys: string[]) {
  const leftCount = { value: 0 };
  const rightCount = { value: 0 };

  return new Map(
    fieldKeys.map((fieldKey, index) => {
      const column: TemplateLayoutFieldColumn = index % 2 === 0 ? 'left' : 'right';
      const nextOrder = column === 'left' ? ++leftCount.value : ++rightCount.value;

      return [
        fieldKey,
        {
          fieldKey,
          column,
          order: nextOrder * 10,
        } satisfies TemplateLayoutFieldPositionDTO,
      ];
    }),
  );
}

function sortFieldPositions(positions: TemplateLayoutFieldPositionDTO[]) {
  return positions.slice().sort((left, right) => {
    const columnCompare = FIELD_COLUMNS.indexOf(left.column) - FIELD_COLUMNS.indexOf(right.column);

    if (columnCompare !== 0) {
      return columnCompare;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.fieldKey.localeCompare(right.fieldKey);
  });
}

function normalizeResolvedFieldPositions(fieldKeys: string[], rawPositions: unknown) {
  const normalizedFieldKeys = getNormalizedFieldKeys(fieldKeys);
  const defaultPositionMap = getDefaultFieldPositionMap(normalizedFieldKeys);
  const rawPositionMap = new Map<string, Partial<TemplateLayoutFieldPositionDTO>>();

  if (Array.isArray(rawPositions)) {
    for (const item of rawPositions) {
      if (!isRecord(item)) {
        continue;
      }

      const fieldKey = trimToUndefined(item.fieldKey);

      if (!fieldKey) {
        continue;
      }

      rawPositionMap.set(fieldKey, {
        fieldKey,
        column: FIELD_COLUMNS.includes(item.column as TemplateLayoutFieldColumn) ? (item.column as TemplateLayoutFieldColumn) : undefined,
        order: typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : undefined,
      });
    }
  }

  const grouped = new Map<TemplateLayoutFieldColumn, Array<{ fieldKey: string; order: number }>>(
    FIELD_COLUMNS.map((column) => [column, []]),
  );

  for (const fieldKey of normalizedFieldKeys) {
    const fallback = defaultPositionMap.get(fieldKey)!;
    const raw = rawPositionMap.get(fieldKey);
    const column = raw?.column ?? fallback.column;
    const order = raw?.order ?? fallback.order;
    grouped.get(column)!.push({ fieldKey, order });
  }

  const normalized: TemplateLayoutFieldPositionDTO[] = [];

  for (const column of FIELD_COLUMNS) {
    const items = grouped.get(column)!;
    items.sort((left, right) => {
      if (left.order !== right.order) {
        return left.order - right.order;
      }

      return left.fieldKey.localeCompare(right.fieldKey);
    });

    items.forEach((item, index) => {
      normalized.push({
        fieldKey: item.fieldKey,
        column,
        order: (index + 1) * 10,
      });
    });
  }

  return {
    positions: sortFieldPositions(normalized),
    defaults: sortFieldPositions(Array.from(defaultPositionMap.values())),
  };
}

function positionsDiffer(left: TemplateLayoutFieldPositionDTO[], right: TemplateLayoutFieldPositionDTO[]) {
  if (left.length !== right.length) {
    return true;
  }

  return left.some((position, index) => {
    const other = right[index];
    return position.fieldKey !== other.fieldKey || position.column !== other.column || position.order !== other.order;
  });
}

export function getFieldKeysFromPositions(positions: TemplateLayoutFieldPositionDTO[]) {
  return positions.map((position) => position.fieldKey);
}

export function getDefaultTemplateLayout(fieldKeys: string[]): ResolvedTemplateLayoutSettings {
  const normalizedFieldKeys = getNormalizedFieldKeys(fieldKeys);
  const defaults = sortFieldPositions(Array.from(getDefaultFieldPositionMap(normalizedFieldKeys).values()));

  return {
    titlePosition: 'left',
    fieldPositions: defaults,
    colors: {},
    isCustomized: false,
  };
}

export function resolveTemplateLayoutSettings(fieldKeys: string[], value: unknown): ResolvedTemplateLayoutSettings {
  const baseLayout = getDefaultTemplateLayout(fieldKeys);

  if (!isRecord(value)) {
    return baseLayout;
  }

  const titlePosition = TITLE_POSITIONS.includes(value.titlePosition as TemplateTitlePosition)
    ? (value.titlePosition as TemplateTitlePosition)
    : 'left';
  const colors = getColorSettings(value.colors);
  const { positions, defaults } = normalizeResolvedFieldPositions(fieldKeys, value.fieldPositions);
  const isCustomized = titlePosition !== 'left' || hasAnyColorValue(colors) || positionsDiffer(positions, defaults);

  return {
    titlePosition,
    fieldPositions: positions,
    colors,
    isCustomized,
  };
}

export function normalizeTemplateLayoutSettings(fieldKeys: string[], value: unknown): TemplateLayoutSettingsDTO | undefined {
  const resolved = resolveTemplateLayoutSettings(fieldKeys, value);
  const defaults = getDefaultTemplateLayout(fieldKeys);
  const hasCustomPositions = positionsDiffer(resolved.fieldPositions, defaults.fieldPositions);
  const hasCustomColors = hasAnyColorValue(resolved.colors);

  if (!resolved.isCustomized) {
    return undefined;
  }

  return {
    titlePosition: resolved.titlePosition !== 'left' ? resolved.titlePosition : undefined,
    fieldPositions: hasCustomPositions ? resolved.fieldPositions : undefined,
    colors: hasCustomColors ? resolved.colors : undefined,
  };
}

export function parseTemplateLayoutSettingsJson(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  return JSON.parse(value) as TemplateLayoutSettingsDTO;
}
