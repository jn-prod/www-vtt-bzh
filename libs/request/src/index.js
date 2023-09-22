import axios from 'axios';

export const get = async (uri) => {
  try {
    return axios.get(encodeURI(uri));
  } catch (e) {
    return {};
  }
};
