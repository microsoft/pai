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
const { Sequelize } = require('sequelize');

const app = express();

app.use(cors());
app.use(compress());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: config.bodyLimit, type: 'application/*' }));
app.use(bodyParser.text({ type: 'text/*' }));
app.use(morgan('dev', { stream: logger.stream }));

const router = new express.Router();

router.route('/ping').get(handler.ping);
router
  .route('/frameworkRequest/:frameworkName')
  .put(handler.putFrameworkRequest);
router
  .route('/frameworkRequest/:frameworkName')
  .patch(handler.patchFrameworkRequest);
router.route('/watchEvents/:eventType').post(handler.postWatchEvents);

app.use('/api/v1', router);

// error handling
app.use((err, req, res, next) => {
  logger.warn(err.stack);
  const statusCode = err.statusCode || 500;
  let message;
  if (err instanceof Sequelize.ConnectionError) {
    message = `There is a problem with your database connection. Please contact your admin. Detailed message: ${err.message}`;
  } else {
    message = err.message;
  }
  res.status(statusCode).json({
    code: status(statusCode),
    message: message,
  });
});

module.exports = app;
