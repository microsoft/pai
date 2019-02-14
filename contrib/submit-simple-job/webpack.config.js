const {resolve} = require('path');

module.exports = (env) => {
  /** @type { import('webpack').Configuration } */
  const config = {
    entry: './index.ts',
    output: {},
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
  };

  if (env === 'development') {
    config.mode = 'development';
    config.output.path = resolve(__dirname, '..', '..',
      'src', 'webportal', 'dist', 'scripts', 'plugins');
    config.output.filename = 'submit-simple-job.js';

    config.watch = true;
    config.watchOptions = {ignored: /node_modules/};
  } else {
    config.mode = 'production';
    config.output.path = resolve(__dirname, 'dist');
    config.output.filename = 'plugin.js';
  }

  return config;
};
