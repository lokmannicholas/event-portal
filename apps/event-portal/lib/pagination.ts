export type PaginationSearchParams = Record<string, string | string[] | undefined>;
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export type PaginationState<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
};

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function paginateItems<T>(
  items: T[],
  searchParams?: PaginationSearchParams,
  defaultPageSize = DEFAULT_PAGE_SIZE,
): PaginationState<T> {
  const rawPageSize = Number.parseInt(getSingleValue(searchParams?.pageSize) ?? String(defaultPageSize), 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(rawPageSize as (typeof PAGE_SIZE_OPTIONS)[number]) ? rawPageSize : defaultPageSize;
  const rawPage = Number.parseInt(getSingleValue(searchParams?.page) ?? '1', 10);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), totalPages) : 1;
  const startIndex = (page - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  const startItem = totalItems === 0 ? 0 : startIndex + 1;
  const endItem = totalItems === 0 ? 0 : startIndex + pageItems.length;

  return {
    items: pageItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
  };
}

export function buildPaginationHref(
  basePath: string,
  searchParams: PaginationSearchParams | undefined,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === 'page' || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
      continue;
    }

    params.set(key, value);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function getPaginationWindow(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_value, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages] as const;
  }

  if (page >= totalPages - 3) {
    return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, 'ellipsis-left', page - 1, page, page + 1, 'ellipsis-right', totalPages] as const;
}
