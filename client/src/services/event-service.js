import request from '../adapters/request';
import { baseUri } from '../app.conf';

const entity = 'events';

const getEvents = async ({ filter, projection, sort }) => {
  const { datas = [] } = await request(`${baseUri}/${entity}?filter=${JSON.stringify(filter)}&projection=${projection}&sort=${JSON.stringify(sort)}`);

  return datas;
};

export default {
  getEvents,
};
