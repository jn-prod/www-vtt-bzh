import { jsonParse } from './json';

export interface IQueryPagination {
  filter?: string;
  limit?: number;
  skip?: number;
  projection?: string;
  sort?: string;
}

export interface IQueryParser {
  (query: string): Record<string, string | number | unknown>;
}

export const queryParser: IQueryParser = (query): Record<string, unknown> =>
  jsonParse(query).match({
    Ok: (parsedQuery: Record<string, unknown>) => {
      if (parsedQuery.fromDate) {
        parsedQuery.date = { $gte: new Date(parsedQuery.fromDate as string) };
        delete parsedQuery.fromDate;
      }

      if (parsedQuery.toDate) {
        parsedQuery.date = { $lte: new Date(parsedQuery.toDate as string) };
        delete parsedQuery.toDate;
      }

      return parsedQuery;
    },
    Error: () => ({}),
  });

export const getProjection = (projection: string): Record<string, number> => {
  const base: Record<string, number> = { _id: 0, name: 1 };
  projection.split('.').forEach((e) => {
    const key = e.replace('"', '');
    if (key.length) {
      base[key] = 1;
    }
  });

  return { ...base };
};
