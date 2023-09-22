import { get } from 'request';

const entity = 'events';

const getEvents = async ({ filter, projection, sort }) => {
  const { datas = [] } = await get(
    `https://ftvt7d5clg.execute-api.eu-west-3.amazonaws.com/production/${entity}?filter=${JSON.stringify(
      filter,
    )}&projection=${projection}&sort=${JSON.stringify(sort)}`,
  );

  return datas;
};

export default {
  getEvents,
};
