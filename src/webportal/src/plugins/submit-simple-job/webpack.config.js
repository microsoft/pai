const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './index.ts',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'submit-simple-job.js',
    path: path.resolve(__dirname, '..', '..', '..', 'dist', 'scripts', 'plugins'),
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
