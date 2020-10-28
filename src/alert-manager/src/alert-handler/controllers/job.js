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

const axios = require('axios');
const logger = require('@alert-handler/common/logger');

const stopJob = async (jobName, token) => {
  return axios.put(
    `${process.env.REST_SERVER_URI}/api/v2/jobs/${jobName}/executionType`,
    { value: 'STOP' },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
};

const stopJobs = (req, res) => {
  logger.info(
    'alert-handler received `stop-jobs` post request from alert-manager.',
  );
  // extract job names
  const jobNames = req.body.alerts
    // filter alerts which are firing and contain `job_name` as label
    .filter((alert) => alert.status === 'firing' && 'job_name' in alert.labels)
    .map((alert) => alert.labels.job_name);

  if (jobNames.length === 0) {
    return res.status(200).json({
      message: 'No job to stop.',
    });
  }
  logger.info(`alert-handler will stop these jobs: ${jobNames}`);

  // stop all these jobs
  Promise.all(jobNames.map((jobName) => stopJob(jobName, req.token)))
    .then((response) => {
      logger.info(`alert-handler successfully stop jobs: ${jobNames}`);
      res.status(200).json({
        message: `alert-handler successfully stop jobs: ${jobNames}`,
      });
    })
    .catch((error) => {
      logger.error(error);
      res.status(500).json({
        message: 'alert-handler failed to stop job',
      });
    });
};

const tagJob = async (jobName, tag, token) => {
  return axios.put(
    `${process.env.REST_SERVER_URI}/api/v2/jobs/${jobName}/tag`,
    { value: tag },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
};

const tagJobs = (req, res) => {
  logger.info(
    'alert-handler received `tag-jobs` post request from alert-manager.',
  );
  // extract job names
  const jobNames = req.body.alerts
    // filter alerts which are firing and contain `job_name` as label
    .filter((alert) => alert.status === 'firing' && 'job_name' in alert.labels)
    .map((alert) => alert.labels.job_name);

  if (jobNames.length === 0) {
    return res.status(200).json({
      message: 'No job to tag.',
    });
  }
  logger.info(`alert-handler will tag these jobs: ${jobNames}`);

  // tag all these jobs
  Promise.all(
    jobNames.map((jobName) => tagJob(jobName, req.params.tag, req.token)),
  )
    .then((response) => {
      logger.info(`alert-handler successfully tag jobs: ${jobNames}`);
      res.status(200).json({
        message: `alert-handler successfully tag jobs: ${jobNames}`,
      });
    })
    .catch((error) => {
      logger.error(error);
      res.status(500).json({
        message: 'alert-handler failed to tag job',
      });
    });
};

// module exports
module.exports = {
  stopJobs,
  tagJobs,
};
