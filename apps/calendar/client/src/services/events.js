import { get } from 'request';

const baseURL = import.meta.env.VITE_APP_API_BASE;
const entity = 'events';

const getEvents = async ({ filter, projection, sort }) => {
  const { datas = [] } = await get(
    baseURL,
    `/${entity}?filter=${JSON.stringify(
      filter,
    )}&projection=${projection}&sort=${JSON.stringify(sort)}`,
  );

  return datas;
};

export default {
  getEvents,
};
