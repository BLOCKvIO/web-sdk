
//
// WebPack config file

const webpack = require('webpack');
const path = require('path');

module.exports = {
  plugins: [],
  module: {
    rules: [],
  },
};
// The app's starting file
module.exports.entry = './src/index.js';

// The final app's JS output file
module.exports.output = {
  path: path.join(__dirname, '/dist/'),
  filename: 'blockv-sdk.min.js',
  libraryTarget: 'var',
  library: 'Blockv',
};
// Output a sourcemap
module.exports.devtool = 'source-map';

// Compile support for ES6 classes and React etc
module.exports.module.rules.push({
  test: /\.js$/,
  exclude: /node_modules/,
  loader: 'babel-loader',
  options: {
    presets: ['env', 'stage-0'],
  },
});

// Compile support for CSS
module.exports.module.rules.push({
  test: /\.css$/,
  loaders: ['style', 'css'],
});
module.exports.module.rules.push({
  test: /(\.scss|\.css)$/,
  loader: 'style!css!postcss!sass',
});

module.exports.module.rules.push({
  test: /(\.png|\.svg|\.jpg)$/,
  loader: 'url-loader',
});
module.exports.node = {
  console: true,
  fs: 'empty',
  net: 'empty',
  tls: 'empty',
};

module.exports.plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
