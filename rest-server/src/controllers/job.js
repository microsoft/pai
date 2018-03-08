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
  new Job(jobName, (job) => {
    if (Object.keys(job).length === 1) {
      // If the job object only contains 'name' field, then the call
      // to the framework launcher must have been failed.
      logger.warn('could not connect to framework launcher');
      return res.status(500).json({
        error: 'CouldNotConnectToFrameworkLauncher',
        message: 'could not connect to framework launcher',
      });
    } else if (job.jobStatus.state === 'JOB_NOT_FOUND' && req.method !== 'PUT') {
      logger.warn('load job %s error, could not find job', jobName);
      return res.status(404).json({
        error: 'JobNotFound',
        message: `could not find job ${jobName}`,
      });
    } else if (job.jobStatus.state !== 'JOB_NOT_FOUND' && req.method === 'PUT') {
      logger.warn('duplicate job %s', jobName);
      return res.status(400).json({
        error: 'DuplicateJobSubmission',
        message: 'duplicate job submission',
      });
    } else {
      req.job = job;
      return next();
    }
  });
};

/**
 * Get list of jobs.
 */
const list = (req, res) => {
  Job.prototype.getJobList((jobList, err) => {
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
  req.body.username = req.user.username;
  Job.prototype.putJob(req.job.name, req.body, (err) => {
    if (err) {
      logger.warn('update job %s error\n%s', req.job.name, err.stack);
      return res.status(500).json({
        error: 'JobUpdateError',
        message: 'job update error',
      });
    } else {
      return res.status(202).json({
        message: `update job ${req.job.name} successfully`,
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
      return res.status(204).json({
        message: `deleted job ${req.job.name} successfully`,
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
    (configJsonString, error) => {
      if (error === null) {
        return res.status(200).json(configJsonString);
      } else if (error.message === 'ConfigFileNotFound') {
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
    (sshInfo, error) => {
      if (error === null) {
        return res.status(200).json(sshInfo);
      } else if (error.message === 'SshInfoNotFound') {
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
  list,
  get,
  update,
  remove,
  getConfig,
  getSshInfo,
};
