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
  job = new Job(jobName, () => {
    if (job.state === 'JOB_NOT_FOUND' && req.method !== 'PUT') {
      logger.warn('load job %s error, could not find job', jobName);
      return res.status(500).json({
        error: job.state,
        message: `could not find job ${jobName}`
      });
    } else if (job.state !== 'JOB_NOT_FOUND' && req.method === 'PUT') {
      logger.warn('duplicate job %s', jobName);
      return res.status(500).json({
        error: 'DuplicateJobSubmission',
        message: 'duplicate job submission'
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
        message: 'get job list error'
      });
    } else if (jobList === undefined || jobList.length === 0) {
      logger.warn('list jobs error, no job found');
      return res.status(500).json({
        error: 'JobListNotFound',
        message: 'could not find job list'
      });
    } else {
      return res.json(jobList);
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
        message: 'job updated error'
      });
    } else {
      return res.json({
        message: `update job ${req.job.name} successfully`
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
      return res.status(401).json({
        error: 'JobDeleteError',
        message: 'job deleted error, cannot delete other user\'s job'
      });
    } else {
      return res.json({
        message: `deleted job ${req.job.name} successfully`
      });
    }
  });
};

// module exports
module.exports = { load, list, get, update, remove };