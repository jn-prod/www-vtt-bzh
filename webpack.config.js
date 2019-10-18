const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MinifyPlugin = require('babel-minify-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './assets/src/main.js',
  output: {
    path: path.resolve(__dirname, './assets/public'),
    filename: 'main.js'
  },
  mode: 'development',
  module: {
    rules: [
	    {
	      enforce: 'pre',
	      test: /\.js?$/,
	      exclude: /node_modules/,
	      use: ['babel-loader'] // , 'eslint-loader'
	    },
      {
        test: /\.html$/,
        use: [ {
          loader: 'html-loader'
        }],
      }
    ]
  },
  plugins: [
    // new HtmlWebpackPlugin({template: './src/index.html'}),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['!images*', '!global.css*']
    })
  ],
}

if (process.env.NODE_ENV === 'production') {
  module.exports.mode = 'production'
  module.exports.plugins.push(new MinifyPlugin())
}
