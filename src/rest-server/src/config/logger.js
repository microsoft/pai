// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies
const util = require('util');
const winston = require('winston');
const config = require('./index');


const logTransports = {
  console: new winston.transports.Console({
    json: false,
    colorize: true,
    timestamp: () => new Date().toISOString(),
    formatter: (options) => {
      const timestamp = options.timestamp();
      const level = winston.config.colorize(
          options.level,
          options.level.toUpperCase()
      );
      const message = options.message ? options.message : '';
      const meta = options.meta && Object.keys(options.meta).length ?
          '\nmeta = ' + JSON.stringify(options.meta, null, 2) : '';
      return util.format(timestamp, '[' + level + ']', message, meta);
    },
  }),
  file: new winston.transports.File({
    json: true,
    colorize: false,
    timestamp: () => Date.now(),
    filename: 'server.log',
  }),
};

// create logger
const logger = new winston.Logger({
  level: config.logLevel,
  transports: [
    logTransports.console,
    logTransports.file,
  ],
  exitOnError: false,
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message.trim());
  },
};

// module exports
module.exports = logger;
