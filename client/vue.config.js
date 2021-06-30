module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/assets/' : '/',
  filenameHashing: false,
  devServer: {
    proxy: {
      '/prod/': {
        target: 'https://gleaypou6k.execute-api.eu-west-3.amazonaws.com',
        ws: true,
        // pathRewrite: {
        //   '^/services/todoService': '/',
        // },
      },
    },
  },
};
