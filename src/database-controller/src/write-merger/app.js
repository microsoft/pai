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

const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const logger = require('@dbc/core/logger')
const status = require('statuses')
const handler = require('@dbc/write-merger/handler')

const app = express();

app.use(cors());
app.use(compress());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.text({type: 'text/*'}));
app.use(morgan('dev', {'stream': logger.stream}));

router = new express.Router();

router.route('/ping').get(handler.ping)
router.route('/frameworks').post(handler.requestCreateFramework)
router.route('/frameworks/:name/execution/:executionType').put(handler.requestExecuteFramework)
router.route('/frameworks/:name/watchEvents/:eventType').post(handler.frameworkWatchEvents)

app.use('/api/v1', router);


// error handling
app.use((err, req, res, next) => {
  logger.warn(err.stack);
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    code: status(statusCode),
    message: err.message,
  });
});



module.exports = app
