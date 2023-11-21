import { get } from 'request';

const baseURL = 'https://ftvt7d5clg.execute-api.eu-west-3.amazonaws.com/production';
const entity = 'events';

const getEvents = async ({ filter, projection, sort }) => {
  const { datas = [] } = await get(baseURL, `/${entity}?filter=${JSON.stringify(filter)}&projection=${projection}&sort=${JSON.stringify(sort)}`);

  return datas;
};

export default {
  getEvents,
};
