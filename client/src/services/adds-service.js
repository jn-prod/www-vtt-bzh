import axios from 'axios';
import moment from 'moment';

const activeWeekNum = moment().week();
const year = moment().year();

export default {
  getAdds: async () => {
    const { data, status } = await axios.get('api/ads.json');
    if (!data && status !== 200) return null;
    // eslint-disable-next-line max-len
    const activeAds = data.filter((val) => Number(val.weekNum) >= activeWeekNum && Number(val.year) >= year);
    if (!activeAds.length) return null;
    return activeAds;
  },
};
