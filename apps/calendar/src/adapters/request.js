const requestUri = async (uri) => {
  // const DOMAIN = 'https://vtt.bzh';
  // const DOMAIN = 'http://localhost:5173';
  try {
    const res = await fetch(encodeURI(uri), {
      // headers: {
      //   // 'Access-Control-Allow-Origin': DOMAIN,
      //   'Access-Control-Allow-Headers': DOMAIN,
      // },
    });
    return res.json();
  } catch (e) {
    return {};
  }
};

export default requestUri;
