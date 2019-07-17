const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MinifyPlugin = require('babel-minify-webpack-plugin')

module.exports = {
  entry: './assets/src/main.js',
  output: {
    path: path.resolve(__dirname, './assets/public'),
    filename: 'app.js'
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
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            scss: ['vue-style-loader', 'css-loader', 'sass-loader']
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['!images*', '!global.css*']
    })
  ],
}

if (process.env.NODE_ENV === 'production') {
  module.exports.mode = 'production'
  module.exports.plugins.push(new MinifyPlugin())
}
