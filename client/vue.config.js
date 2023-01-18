const { baseUri } = require('./src/app.conf');

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/assets/' : '/',
  filenameHashing: false,
  devServer: {
    proxy: {
      '^/events': {
        target: baseUri,
        ws: true,
        changeOrigin: true
      },
    },
  },
};
