const requestUri = async (uri) => {
  try {
    const res = await fetch(encodeURI(uri));
    return res.json();
  } catch (e) {
    return {};
  }
};

export default requestUri;
