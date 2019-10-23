//jshint strict: false
const webpackConfig = require("./webpack.config")

module.exports = function(config) {
  config.set({

    // basePath: './assets/src/app',

    frameworks: ['jasmine'],

    autoWatch: true,

    browsers: ['Chrome', 'Firefox'],

    reporters: ['dots'],

    files: [
      "node_modules/angular/angular.js",
      "node_modules/angular-mocks/angular-mocks.js",
      "./assets/src/main.js",
      "./assets/*.spec.js",
      "./assets/**/*.spec.js"
    ],

    preprocessors: {
      "./assets/src/main.js": ["webpack"],
      "./assets/*.spec.js": ["webpack"],
      "./assets/**/*.spec.js": ["webpack"]
    },

    webpack: webpackConfig,

    webpackMiddleware: {
      noInfo: true,
      stats: "verbose"
    },

    plugins: [
      'karma-webpack',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-jasmine'
    ]
  });
};