import axios from 'axios';
// import formater from '@luckylab/json-formater';
import { dateFormat, dateNow } from '../utils/date';

export default {
  getEvents: async () => {
    try {
      const { data, status } = await axios.get('https://gleaypou6k.execute-api.eu-west-3.amazonaws.com/prod/events');
      const { data: customEvents } = await axios.get('/api/events.json');

      if (!data && status !== 200) return [];

      const { data: formatedData } = data;

      return [...formatedData, ...customEvents].filter((val) => {
        if (!val.date) return false;
        return dateFormat(val.date) >= dateNow;
      }).sort((a, b) => dateFormat(a.date) - dateFormat(b.date));
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
};
