// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const logger = require('@dbc/common/logger');
const status = require('statuses');
const handler = require('@dbc/write-merger/handler');
const config = require('@dbc/write-merger/config');

const app = express();

app.use(cors());
app.use(compress());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: config.bodyLimit }));
app.use(bodyParser.text({ type: 'text/*' }));
app.use(morgan('dev', { stream: logger.stream }));

const router = new express.Router();

router.route('/ping').get(handler.ping);
router.route('/frameworkRequest').put(handler.receiveFrameworkRequest);
router.route('/watchEvents/:eventType').post(handler.receiveWatchEvents);

app.use('/api/v1', router);

// error handling
app.use((err, req, res, next) => {
  logger.warn(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: status(statusCode),
    message: err.message,
  });
});

module.exports = app;
