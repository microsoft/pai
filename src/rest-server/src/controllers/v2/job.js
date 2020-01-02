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
const status = require('statuses');

const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const createError = require('@pai/utils/error');
const job = require('@pai/models/v2/job');


const list = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query) {
    if ('username' in req.query) {
      filters['labelSelector'] = `userName=${req.query.username}`;
    }
  }
  const data = await job.list(filters);
  res.json(data);
});

const get = asyncHandler(async (req, res) => {
  const data = await job.get(req.params.frameworkName);
  res.json(data);
});

const update = asyncHandler(async (req, res) => {
  const jobName = res.locals.protocol.name;
  const userName = req.user.username;
  const frameworkName = `${userName}~${jobName}`;
  const userToken = req.headers.authorization;

  // check duplicate job
  try {
    const data = await job.get(frameworkName);
    if (data != null) {
      throw createError('Conflict', 'ConflictJobError', `Job ${frameworkName} already exists.`);
    }
  } catch (error) {
    if (error.code !== 'NoJobError') {
      throw error;
    }
  }
  await job.put(frameworkName, res.locals.protocol, req.body, userToken);
  res.status(status('Accepted')).json({
    status: status('Accepted'),
    message: `Update job ${jobName} for user ${userName} successfully.`,
  });
});

const execute = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  const data = await job.get(req.params.frameworkName);
  if ((data.jobStatus.username === userName) || admin) {
    await job.execute(req.params.frameworkName, req.body.value);
    res.status(status('Accepted')).json({
      status: status('Accepted'),
      message: `Execute job ${req.params.frameworkName} successfully.`,
    });
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to execute job ${req.params.frameworkName}.`
    );
  }
});

const getConfig = asyncHandler(async (req, res) => {
  try {
    const data = await job.getConfig(req.params.frameworkName);
    return res.status(200).type('text/yaml').send(data);
  } catch (error) {
    if (error.message.startsWith('[WebHDFS] 404')) {
      throw createError('Not Found', 'NoJobConfigError', `Config of job ${req.params.frameworkName} is not found.`);
    } else {
      throw createError.unknown(error);
    }
  }
});

const getSshInfo = asyncHandler(async (req, res) => {
  const data = await job.getSshInfo(req.params.frameworkName);
  res.json(data);
});

// module exports
module.exports = {
  list,
  get,
  update,
  execute,
  getConfig,
  getSshInfo,
};
