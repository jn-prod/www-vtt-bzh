import request from '../adapters/request';

const entity = 'events';

const getEvents = async ({ filter, projection, sort }) => {
  const { datas = [] } = await request(
    `${import.meta.env.VITE_APP_API_BASE}/${entity}?filter=${JSON.stringify(
      filter,
    )}&projection=${projection}&sort=${JSON.stringify(sort)}`,
  );

  return datas;
};

export default {
  getEvents,
};
