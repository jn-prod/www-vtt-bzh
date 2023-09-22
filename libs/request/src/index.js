export const get = async (baseURL, uri) => {
  try {
    const res = await fetch(encodeURI(baseURL + uri));
    return res.json()
  } catch (e) {
    return {};
  }
};
