import { DBPagination } from '../types';

export * from './scopes';
export * from './temp';

// TODO: remove when frontend refactors
export const tmpRestFix = (serviceName: string) => [
  serviceName.replace(/\./g, '/'),
  serviceName.substring(serviceName.indexOf('.') + 1).replace(/\./g, '/'),
];

export const tableName = (serviceName: string) =>
  serviceName
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

export const handlePagination = ({
  data,
  page,
  pageSize,
}: {
  data: any[];
  page: number;
  pageSize: number;
}): DBPagination<any> => {
  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  const totalPages = Math.ceil(data.length / pageSize);
  const rows = data.slice(start, end);

  return { rows, totalPages, page, total: data.length, pageSize };
};

export function parseQueryIfNeeded(query: any) {
  if (!query) return query;

  if (typeof query !== 'object') {
    try {
      query = JSON.parse(query);
    } catch (err) {}
  }

  return query;
}
