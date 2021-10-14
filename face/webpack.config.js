
//
// WebPack config file

const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: ['@babel/polyfill', path.join(__dirname, 'index-browser.js')],
  devServer: {
    publicPath: '/',
  },
  output: {
    path: path.join(__dirname, '../dist/'),
    filename: 'blockv-faces.min.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style', 'css']
      },
      {
        test: /(\.scss|\.css)$/,
        use: 'style!css!postcss!sass'
      },
      {
        test: /(\.png|\.svg|\.jpg)$/,
        use: 'url-loader'
      }
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: { util: false, 
      stream: false,
      fs: 'empty',
      net: 'empty',
      tls: 'empty' },
  }
};
