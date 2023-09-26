import mixpanel from 'mixpanel-browser';

export const setup = (token, config) => {
  mixpanel.init(token, {
    ...config,
    debug: false,
    track_pageview: true,
    persistence: 'localStorage',
  });
};
