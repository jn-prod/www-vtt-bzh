import { jsonParse } from './json';

type DateQueryType = undefined | {
  $gte?: Date,
  $lte?: Date
}

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
    Ok: (parsedQuery = {}) => {
      if (typeof parsedQuery === 'object') {
        const value: Record<string, unknown> = {...parsedQuery};
  
        let date: DateQueryType = {};
        if (parsedQuery.fromDate) {
          date = { ...date, $gte: new Date(parsedQuery.fromDate as string) };
        }
        
        if (parsedQuery.toDate) {
          date = { ...date, $lte: new Date(parsedQuery.toDate as string) };
        }
  
        // clean value
        delete value.fromDate;
        delete value.toDate;
  
        return {...value, date};
      } else {
        return {}
      }
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
