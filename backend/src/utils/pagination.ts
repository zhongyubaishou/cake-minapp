export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface PaginationOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
}

export function normalizePagination(input: PaginationInput, options: PaginationOptions = {}) {
  const defaultPageSize = options.defaultPageSize ?? 10;
  const maxPageSize = options.maxPageSize ?? 50;
  const page = Math.max(1, Math.floor(Number(input.page) || 1));
  const requestedPageSize = Math.floor(Number(input.pageSize) || defaultPageSize);
  const pageSize = Math.min(Math.max(1, requestedPageSize), maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}
