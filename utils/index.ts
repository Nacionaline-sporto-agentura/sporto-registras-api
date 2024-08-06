import { get, isEmpty } from 'lodash';
import moment from 'moment';
import { SportsBase } from '../services/sportsBases/index.service';
import { DBPagination, DateFormats } from '../types';

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

export const sortByField = ({ data, field }: { data: any[]; field: string }) => {
  if (isEmpty(data)) return [];

  const isDesc = field[0] === '-';
  const sortField = isDesc ? field.slice(1) : field;
  const isNumberValue = typeof get(data[0], sortField) === 'number';

  return data.sort((first, second) => {
    if (isDesc) {
      if (isNumberValue) {
        return get(second, sortField) - get(first, sortField);
      } else {
        return get(second, sortField).localeCompare(get(first, sortField));
      }
    } else {
      if (isNumberValue) {
        return get(first, sortField) - get(second, sortField);
      } else {
        return get(first, sortField).localeCompare(get(second, sortField));
      }
    }
  });
};

const isBooleanString = (str: string) => {
  return str === 'true' || str === 'false';
};

const isValidDateString = (str: string) => {
  const date = new Date(str);
  return !isNaN(date.getTime());
};

const matchesQuery = (value: any, query: any): any => {
  if (Array.isArray(value)) {
    return value.some((item) => matchesQuery(item, query));
  } else if (typeof value === 'string') {
    return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  } else if (typeof value === 'number' && !isNaN(Number(query))) {
    const queryNumber = Number(query);
    return value === queryNumber;
  } else if (isBooleanString(query)) {
    if (query === 'true') {
      return value === true;
    }

    return [false, undefined, null].includes(value);
  } else if (value instanceof Date) {
    const itemDate = parseDate(value);

    if (isValidDateString(query)) {
      const queryDate = parseDate(query);
      return itemDate.isSame(queryDate);
    } else if (typeof query === 'object') {
      if (query.$gt && isValidDateString(query.$gt) && !itemDate.isAfter(parseDate(query.$gt))) {
        return false;
      }
      if (
        query.$gte &&
        isValidDateString(query.$gte) &&
        !itemDate.isSameOrAfter(parseDate(query.$gte))
      ) {
        return false;
      }
      if (query.$lt && isValidDateString(query.$lt) && !itemDate.isBefore(parseDate(query.$lt))) {
        return false;
      }
      if (
        query.$lte &&
        isValidDateString(query.$lte) &&
        !itemDate.isSameOrBefore(parseDate(query.$lte))
      ) {
        return false;
      }
      return true;
    }
  }
  return false;
};

export const searchByFields = ({
  data,
  search,
}: {
  data: any[];
  search: { [key: string]: any };
}) => {
  if (isEmpty(data)) return [];

  return data.filter((item) => {
    return Object.keys(search).some((searchField) => {
      const queryValue = search[searchField];
      const itemValue = get(item, searchField);

      return matchesQuery(itemValue, queryValue);
    });
  });
};
export const handleFormatResponse = ({
  data,
  all,
  page,
  pageSize,
  search,
  sort,
  fields,
}: {
  data: any[];
  page: number;
  search: { [key: string]: any };
  pageSize: number;
  sort?: string;
  all?: boolean;
  fields?: string[];
}) => {
  if (search) {
    data = searchByFields({
      data,
      search,
    });
  }

  if (sort) {
    data = sortByField({
      data,
      field: sort,
    });
  }

  if (all) {
    return data;
  }

  const { rows, totalPages } = handlePagination({
    data,
    page,
    pageSize,
  });

  const mappedRows = !!fields
    ? rows.map((row: any) => {
        const newRow = fields.reduce((acc: any, field: string) => {
          acc[field] = row[field];
          return acc;
        }, {});
        return newRow;
      })
    : rows;

  return {
    rows: mappedRows,
    total: data.length,
    pageSize,
    page,
    totalPages,
  };
};

export const getSportsBaseUniqueSportTypes = (
  sportsBase:
    | SportsBase<'spaces'>
    | SportsBase<'tenant' | 'spaces' | 'tenants'>
    | SportsBase<'spaces' | 'tenant' | 'type'>,
) => {
  const sportTypes = sportsBase.spaces.flatMap((space) => space.sportTypes);
  const uniqueSportTypes = Array.from(new Set(sportTypes.map((sportType) => sportType.name))).map(
    (name) => sportTypes.find((sportType) => sportType.name === name),
  );

  return uniqueSportTypes;
};

export const getFormattedDate = (date?: string | Date) => formatDate(date, DateFormats.DAY);

export const getFormattedYear = (date?: string | Date) => formatDate(date, DateFormats.YEAR);

export const formatDate = (date: string | Date, format: DateFormats) =>
  date ? moment(date).format(format) : '-';

export const parseDate = (date: string | Date) => moment(date, 'YYYY-MM-DD').startOf('day');

export function parseQueryIfNeeded(query: any) {
  if (!query) return query;

  if (typeof query !== 'object') {
    try {
      query = JSON.parse(query);
    } catch (err) {}
  }

  return query;
}
