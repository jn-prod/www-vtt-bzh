import axios from 'axios';
import { dateFormat, dateNow } from '../utils/date';

const setEventsCache = (events) => {
  const date = new Date();
  const expireAt = date.setDate(date.getDate() + 1);
  window.localStorage.setItem('events', JSON.stringify({ data: events, expireAt }));
};

const getEventsFromCache = () => {
  try {
    const events = window.localStorage.getItem('events');
    if (!events) return null;
    const { data, expireAt } = JSON.parse(events);
    if (new Date(expireAt) >= new Date()) return data;
    return null;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getEventsFromApi = async () => {
  try {
    const { data, status } = await axios.get('https://gleaypou6k.execute-api.eu-west-3.amazonaws.com/prod/events');
    const { data: customEvents } = await axios.get('/api/events.json');
    // const customEvents = [];
    if (!data && status !== 200) return [];

    const { data: formatedData } = data;

    const events = [...formatedData, ...customEvents];

    setEventsCache(events);

    return events;
  } catch (e) {
    console.error(e);
    throw (e);
  }
};

const getEvents = async () => {
  try {
    let events;
    const eventsFromCache = getEventsFromCache();
    if (eventsFromCache) {
      events = eventsFromCache;
    } else {
      events = await getEventsFromApi();
    }

    return events.filter((val) => {
      if (!val.date) return false;
      return dateFormat(val.date) >= dateNow;
    }).sort((a, b) => dateFormat(a.date) - dateFormat(b.date));
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export default {
  getEvents,
};
