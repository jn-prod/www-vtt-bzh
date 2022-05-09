import axios from 'axios';
import { baseUri } from '../app.conf';

const service = 'calendar';
const entity = 'events';

const getEvents = async ({ filter, projection, sort }) => {
  try {
    const { data: body = {}, status } = await axios.get(`${baseUri}/${service}/${entity}?filter=${JSON.stringify(filter)}&projection=${projection}&sort=${JSON.stringify(sort)}`);

    if (status !== 200) return [];

    return body.events || [];
  } catch (e) {
    console.error(e);
    throw (e);
  }
};

export default {
  getEvents,
};
