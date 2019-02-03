const { resolve } = require('path')

module.exports = {
  mode: 'production',
  entry: './index.ts',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }],
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: 'plugin.js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
