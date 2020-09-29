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

const unirest = require('unirest');
const logger = require('@alert-handler/common/logger');

const stopJobs = (req, res) => {
  logger.info(
    'alert-handler received `stop-jobs` post request from alert-manager.',
  );
  // extract jobs to kill
  const jobNames = [];
  req.body.alerts.forEach(function (alert) {
    if (alert.status === 'firing') {
      jobNames.push(alert.labels.job_name);
    }
  });

  if (jobNames.length === 0) {
    res.status(200).json({
      message: 'No job to stop.',
    });
  }
  logger.info(`alert-handler will stop these jobs: ${jobNames}`);

  const url = process.env.REST_SERVER_URI;
  const token = req.token;
  // stop job by sending put request to rest server
  jobNames.forEach(function (jobName) {
    unirest
      .put(`${url}/api/v2/jobs/${jobName}/executionType`)
      .headers({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(JSON.stringify({ value: 'STOP' }))
      .end(function (response) {
        if (!response.ok) {
          logger.error('alert-handler failed to stop-job.');
          logger.error(response.raw_body);
          res.status(500).json({
            message: 'alert-handler failed to stop-job.',
          });
        }
      });
  });

  logger.info('alert-handler successfully stop jobs.');
  res.status(200).json({
    message: 'alert-handler successfully stop jobs.',
  });
};

const tagJobs = (req, res) => {
  logger.info(
    'alert-handler received `tag-jobs` post request from alert-manager.',
  );

  const url = process.env.REST_SERVER_URI;
  const token = req.token;
  const tag = req.params.tag;

  // tag job with alertname
  req.body.alerts.forEach(function (alert) {
    if (alert.status === 'firing') {
      const jobName = alert.labels.job_name;
      // tag job by sending put request to rest server
      unirest
        .put(`${url}/api/v2/jobs/${jobName}/tag`)
        .headers({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        })
        .send(JSON.stringify({ value: tag }))
        .end(function (response) {
          if (!response.ok) {
            logger.error('alert-handler failed to tag jobs.');
            logger.error(response.raw_body);
            res.status(500).json({
              message: 'alert-handler failed to tag jobs.',
            });
          }
        });
    }
  });

  logger.info('alert-handler successfully tag jobs.');
  res.status(200).json({
    message: 'alert-handler successfully tag jobs.',
  });
};

// module exports
module.exports = {
  stopJobs,
  tagJobs,
};
