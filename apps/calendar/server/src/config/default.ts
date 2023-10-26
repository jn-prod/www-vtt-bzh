export default () => ({
  vttBzh: {
    cronStartUri: process.env.CRON_START_URI,
  },
  mongoUrl: process.env.MONGO_URL,
  domains: ['https://vtt.bzh', /http:\/\/localhost/],
  admin: {
    name: process.env.ADMIN_NAME,
    password: process.env.ADMIN_PASSWORD,
  },
  auth: {
    jwtKey: process.env.JWT_KEY,
  },
});
