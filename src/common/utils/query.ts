export const queryParser = (query: string): any => {
  let parsedQuery: any = {};
  try {
    parsedQuery = JSON.parse(query);
  } catch (e) {
    console.log('enable to parse query');
  }

  if (parsedQuery.fromDate) {
    parsedQuery.date = { $gte: parsedQuery.fromDate };
    delete parsedQuery.fromDate;
  }

  if (parsedQuery.toDate) {
    parsedQuery.date = { $lte: parsedQuery.toDate };
    delete parsedQuery.toDate;
  }

  return parsedQuery;
};

export const getProjection = (projection: string): any => {
  const base = { _id: 0, name: 1 };
  projection.split('.').forEach((e) => {
    const key = e.replace('"', '');
    if (key.length) {
      base[key] = 1;
    }
  });

  return { ...base };
};
