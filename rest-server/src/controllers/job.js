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
const Job = require('../models/job');
const logger = require('../config/logger');

/**
 * Load job and append to req.
 */
const load = (req, res, next, jobName) => {
  new Job(jobName, (job, error) => {
    if (error) {
      if (error.message === 'JobNotFound') {
        if (req.method !== 'PUT') {
          logger.warn('load job %s error, could not find job', jobName);
          return res.status(404).json({
            error: 'JobNotFound',
            message: `could not find job ${jobName}`,
          });
        }
      } else {
        logger.warn('internal server error');
        return res.status(500).json({
          error: 'InternalServerError',
          message: 'internal server error',
        });
      }
    } else {
      if (job.jobStatus.state !== 'JOB_NOT_FOUND' && req.method === 'PUT' && req.path === `/${jobName}`) {
        logger.warn('duplicate job %s', jobName);
        return res.status(400).json({
          error: 'DuplicateJobSubmission',
          message: `job already exists: '${jobName}'`,
        });
      }
    }
    req.job = job;
    return next();
  });
};

const init = (req, res, next) => {
  const jobName = req.body.jobName;
  new Job(jobName, (job, error) => {
    if (error) {
      if (error.message === 'JobNotFound') {
        req.job = job;
        next();
      } else {
        logger.warn('internal server error');
        return res.status(500).json({
          error: 'InternalServerError',
          message: 'internal server error',
        });
      }
    } else {
      logger.warn('duplicate job %s', jobName);
      return res.status(400).json({
        error: 'DuplicateJobSubmission',
        message: `job already exists: '${jobName}'`,
      });
    }
  });
};

/**
 * Get list of jobs.
 */
const list = (req, res) => {
  Job.prototype.getJobList(req._query, (jobList, err) => {
    if (err) {
      logger.warn('list jobs error\n%s', err.stack);
      return res.status(500).json({
        error: 'GetJobListError',
        message: 'get job list error',
      });
    } else if (jobList === undefined) {
      logger.warn('list jobs error, no job found');
      return res.status(500).json({
        error: 'JobListNotFound',
        message: 'could not find job list',
      });
    } else {
      return res.status(200).json(jobList);
    }
  });
};

/**
 * Get job status.
 */
const get = (req, res) => {
  return res.json(req.job);
};

/**
 * Submit or update job.
 */
const update = (req, res) => {
  let name = req.job.name;
  let data = req.body;
  data.originalData = req.originalBody;
  data.userName = req.user.username;
  Job.prototype.putJob(name, data, (err) => {
    if (err) {
      logger.warn('update job %s error\n%s', name, err.stack);
      if (err.message === 'VirtualClusterNotFound') {
        return res.status(500).json({
          error: 'JobUpdateWithInvalidVirtualCluster',
          message: `job update error: could not find virtual cluster ${data.virtualCluster}`,
        });
      } else if (err.message === 'NoRightAccessVirtualCluster') {
        return res.status(401).json({
          error: 'JobUpdateWithNoRightVirtualCluster',
          message: `job update error: no virtual cluster right to access ${data.virtualCluster}`,
        });
      } else {
        return res.status(500).json({
          error: 'JobUpdateError',
          message: err.message,
        });
      }
    } else {
      return res.status(202).json({
        message: `update job ${name} successfully`,
      });
    }
  });
};

/**
 * Remove job.
 */
const remove = (req, res) => {
  req.body.username = req.user.username;
  req.body.admin = req.user.admin;
  Job.prototype.deleteJob(req.job.name, req.body, (err) => {
    if (err) {
      logger.warn('delete job %s error\n%s', req.job.name, err.stack);
      return res.status(403).json({
        error: 'JobDeleteError',
        message: 'job deleted error, cannot delete other user\'s job',
      });
    } else {
      return res.status(202).json({
        message: `deleted job ${req.job.name} successfully`,
      });
    }
  });
};

/**
 * Start or stop job.
 */
const execute = (req, res, next) => {
  req.body.username = req.user.username;
  req.body.admin = req.user.admin;
  Job.prototype.putJobExecutionType(req.job.name, req.body, (err) => {
    if (err) {
      logger.warn('execute job %s error\n%s', req.job.name, err.stack);
      err.message = err.message || 'job execute error';
      next(err);
    } else {
      return res.status(202).json({
        message: `execute job ${req.job.name} successfully`,
      });
    }
  });
};

/**
 * Get job config json string.
 */
const getConfig = (req, res) => {
  Job.prototype.getJobConfig(
    req.job.jobStatus.username,
    req.job.name,
    (error, result) => {
      if (!error) {
        return res.status(200).json(result);
      } else if (error.message.startsWith('[WebHDFS] 404')) {
        return res.status(404).json({
          error: 'ConfigFileNotFound',
          message: error.message,
        });
      } else {
        return res.status(500).json({
          error: 'InternalServerError',
          message: error.message,
        });
      }
    }
  );
};

/**
 * Get job SSH info.
 */
const getSshInfo = (req, res) => {
  Job.prototype.getJobSshInfo(
    req.job.jobStatus.username,
    req.job.name,
    req.job.jobStatus.appId,
    (error, result) => {
      if (!error) {
        return res.status(200).json(result);
      } else if (error.message.startsWith('[WebHDFS] 404')) {
        return res.status(404).json({
          error: 'SshInfoNotFound',
          message: error.message,
        });
      } else {
        return res.status(500).json({
          error: 'InternalServerError',
          message: error.message,
        });
      }
    }
  );
};

// module exports
module.exports = {
  load,
  init,
  list,
  get,
  update,
  remove,
  execute,
  getConfig,
  getSshInfo,
};
