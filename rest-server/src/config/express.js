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
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./index');
const logger = require('./logger');
const router = require('../routes/index');


const app = express();

app.use(cors());
app.use(compress());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

// setup the logger for requests
app.use(morgan('dev', {'stream': logger.stream}));

// mount all v1 APIs to /api/v1
app.use('/api/v1', router);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('API not found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  logger.warn('%s', err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    error: config.env === 'development' ? err.stack : '',
  });
});

// module exports
module.exports = app;
