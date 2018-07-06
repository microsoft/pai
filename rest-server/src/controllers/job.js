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
const createError = require('../util/error');
const logger = require('../config/logger');

/**
 * Load job and append to req.
 */
const load = (req, res, next, jobName) => {
  new Job(jobName, (job, error) => {
    if (error) {
      if (error.code === 'ERR_NO_JOB') {
        if (req.method !== 'PUT') {
          return next(error);
        }
      } else {
        return next(createError.unknown(error));
      }
    } else {
      if (job.jobStatus.state !== 'JOB_NOT_FOUND' && req.method === 'PUT' && req.path === `/${jobName}`) {
        return next(createError('Conflict', 'ERR_CONFLICT_JOB', `Job name ${jobName} already exists`));
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
      if (error.code === 'ERR_NO_JOB') {
        req.job = job;
        next();
      } else {
        return next(createError.unknown(error));
      }
    } else {
      return next(createError('Conflict', 'ERR_CONFLICT_JOB', `Job name ${jobName} already exists`));
    }
  });
};

/**
 * Get list of jobs.
 */
const list = (req, res, next) => {
  Job.prototype.getJobList(req._query, (jobList, err) => {
    if (err) {
      return next(createError.unknown(err));
    } else if (jobList === undefined) {
      // Unreachable
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
const update = (req, res, next) => {
  let name = req.job.name;
  let data = req.body;
  data.originalData = req.originalBody;
  data.userName = req.user.username;
  Job.prototype.putJob(name, data, (err) => {
    if (err) {
      return next(createError.unknown(err));
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
const remove = (req, res, next) => {
  req.body.username = req.user.username;
  req.body.admin = req.user.admin;
  Job.prototype.deleteJob(req.job.name, req.body, (err) => {
    if (err) {
      return next(createError.unknown(err));
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
      return next(createError.unknown(err));
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
const getConfig = (req, res, next) => {
  Job.prototype.getJobConfig(
    req.job.jobStatus.username,
    req.job.name,
    (error, result) => {
      if (!error) {
        return res.status(200).json(result);
      } else if (error.message.startsWith('[WebHDFS] 404')) {
        return next(createError('Not Found', 'ERR_NO_JOB_CONFIG', `Config of job ${req.job.name} not found.`));
      } else {
        return next(createError.unknown(error));
      }
    }
  );
};

/**
 * Get job SSH info.
 */
const getSshInfo = (req, res, next) => {
  Job.prototype.getJobSshInfo(
    req.job.jobStatus.username,
    req.job.name,
    req.job.jobStatus.appId,
    (error, result) => {
      if (!error) {
        return res.status(200).json(result);
      } else if (error.message.startsWith('[WebHDFS] 404')) {
        return next(createError('Not Found', 'ERR_NO_JOB_SSH', `SSH of job ${req.job.name} not found.`));
      } else {
        return next(createError.unknown(error));
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
