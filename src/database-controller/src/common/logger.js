// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const util = require('util');
const winston = require('winston');
const config = require('./config');

const logTransports = {
  console: new winston.transports.Console({
    json: false,
    colorize: true,
    timestamp: () => new Date().toISOString(),
    formatter: options => {
      const timestamp = options.timestamp();
      const level = winston.config.colorize(
        options.level,
        options.level.toUpperCase(),
      );
      const message = options.message ? options.message : '';
      const meta =
        options.meta && Object.keys(options.meta).length
          ? '\nmeta = ' + JSON.stringify(options.meta, null, 2)
          : '';
      return util.format(timestamp, '[' + level + ']', message, meta);
    },
  }),
};

// create logger
const logger = new winston.Logger({
  level: config.logLevel,
  transports: [logTransports.console],
  exitOnError: false,
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message.trim());
  },
};

// module exports
module.exports = logger;
