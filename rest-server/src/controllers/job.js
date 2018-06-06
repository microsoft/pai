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
const httpStatus = require('http-status');
const Job = require('../models/job');

/**
 * Load job and append to req.
 */
const load = (req, res, next, jobName) => {
  new Job(jobName, (job, error) => {
    if (error) {
      if (error.message === 'Could not find job.') {
        if (req.method !== 'PUT' && req.method !== 'POST') {
          error.status = httpStatus.NOT_FOUND;
          error.message = `Get job error: could not find job ${jobName}.`;
          next(error);
        }
      } else {
        error.status = httpStatus.INTERNAL_SERVER_ERROR;
        next(error);
      }
    } else {
      if (req.method === 'PUT' && req.path === `/${jobName}` || req.method === 'POST' && req.path === '/') {
        const error = new Error(`Submit job error: job ${jobName} already exists.`);
        error.status = httpStatus.BAD_REQUEST;
        next(error);
      }
    }
    req.job = job;
    next();
  });
};

/**
 * Get list of jobs.
 */
const list = (req, res, next) => {
  Job.prototype.getJobList(req._query, (jobList, err) => {
    if (err) {
      err.status = httpStatus.INTERNAL_SERVER_ERROR;
      err.message = 'List job error: error occurs in getting job list.';
      next(err);
    } else if (jobList === undefined) {
      err.status = httpStatus.INTERNAL_SERVER_ERROR;
      err.message = 'List job error: get empty job list.';
      next(err);
    } else {
      return res.status(httpStatus.OK).json(jobList);
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
      if (err.message === 'VirtualClusterNotFound') {
        err.status = httpStatus.INTERNAL_SERVER_ERROR;
        err.message = `Update job error: could not find virtual cluster ${data.virtualCluster}.`;
        next(err);
      } else if (err.message === 'NoRightAccessVirtualCluster') {
        err.status = httpStatus.UNAUTHORIZED;
        err.message = `Update job error: no virtual cluster right to access ${data.virtualCluster}.`;
        next(err);
      } else {
        err.status = httpStatus.INTERNAL_SERVER_ERROR;
        next(err);
      }
    } else {
      return res.status(httpStatus.ACCEPTED).json({
        message: `Update job ${name} successfully.`,
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
      err.status = httpStatus.FORBIDDEN;
      next(err);
    } else {
      return res.status(httpStatus.ACCEPTED).json({
        message: `Delete job ${req.job.name} successfully.`,
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
      err.status = httpStatus.INTERNAL_SERVER_ERROR;
      next(err);
    } else {
      return res.status(httpStatus.ACCEPTED).json({
        message: `Execute job ${req.job.name} successfully.`,
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
        return res.status(httpStatus.OK).json(result);
      } else if (error.message.startsWith('[WebHDFS] 404')) {
        error.status = httpStatus.NOT_FOUND;
        next(error);
      } else {
        error.status = httpStatus.INTERNAL_SERVER_ERROR;
        next(error);
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
        return res.status(httpStatus.OK).json(result);
      } else if (error.message.startsWith('[WebHDFS] 404')) {
        error.status = httpStatus.NOT_FOUND;
        next(error);
      } else {
        error.status = httpStatus.INTERNAL_SERVER_ERROR;
        next(error);
      }
    }
  );
};

// module exports
module.exports = {
  load,
  list,
  get,
  update,
  remove,
  execute,
  getConfig,
  getSshInfo,
};
