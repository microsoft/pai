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

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
const logger = require('@alert-handler/common/logger');

// clean TTL 24 hours jobs created by alert-handler
const cleanTTL24HJobs = () => {
  logger.info('Cleaning completed TTL 24h jobs...');

  const k8sApi = kc.makeApiClient(k8s.BatchV1Api);
  k8sApi
    .listNamespacedJob(
      'default',
      undefined,
      undefined,
      undefined,
      undefined,
      'created-by=alert-handler,time-to-live=24h', // labelSelector
    )
    .then((response) => {
      logger.info(`Successfully get job list.`);
      const jobs = response.body.items;
      jobs.forEach((job) => {
        const jobName = job.metadata.name;
        if (
          (job.status.succeeded === 1 || jobs.status.failed === 1) && // check if the job has completed
          new Date() - new Date(job.status.completionTime) > 24 * 60 * 60 * 1000 // completed for more than 24h
        )
          k8sApi
            .deleteNamespacedJob(jobName, 'default')
            .then((response) => {
              logger.info(`Successfully deleted job ${jobName}`);
            })
            .catch((error) => {
              logger.info(`Failed to delete job ${jobName}`, error);
            });
      });
    })
    .catch((error) => {
      logger.error('Failed to list jobs:', error);
    });
};

// module exports
module.exports = {
  cleanTTL24HJobs,
};
