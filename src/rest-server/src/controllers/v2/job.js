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
const { job, log } = require('@pai/models/v2/job');
const logger = require('@pai/config/logger');
const { Op } = require('sequelize');

const list = asyncHandler(async (req, res) => {
  // ?keyword=<keyword filter>&username=<username1>,<username2>&vc=<vc1>,<vc2>
  //    &state=<state1>,<state2>&offset=<offset>&limit=<limit>&withTotalCount=true
  //    &tags=<tag1>,<tag2>
  //    &order=state,DESC
  const filters = {};
  const tagsContainFilter = {};
  const tagsNotContainFilter = {};
  let offset = 0;
  let limit;
  let withTotalCount = false;
  const order = [];
  // limit has a max number and a default number
  const maxLimit = 50000;
  const defaultLimit = 5000;
  if (req.query) {
    if ('username' in req.query) {
      filters.userName = req.query.username.split(',');
    }
    if ('vc' in req.query) {
      filters.virtualCluster = req.query.vc.split(',');
    }
    if ('state' in req.query) {
      filters.state = req.query.state.split(',');
    }
    if ('offset' in req.query) {
      offset = parseInt(req.query.offset);
    }
    if ('limit' in req.query) {
      limit = parseInt(req.query.limit);
      if (limit > maxLimit) {
        throw createError(
          'Bad Request',
          'InvalidParametersError',
          `Limit exceeds max number ${maxLimit}.`,
        );
      }
    } else {
      limit = defaultLimit;
    }
    if ('withTotalCount' in req.query && req.query.withTotalCount === 'true') {
      withTotalCount = true;
    }
    if ('tagsContain' in req.query) {
      tagsContainFilter.name = req.query.tagsContain.split(',');
    }
    if ('tagsNotContain' in req.query) {
      tagsNotContainFilter.name = req.query.tagsNotContain.split(',');
    }
    if ('keyword' in req.query) {
      // match text in username, jobname, or vc
      filters[Op.or] = [
        { userName: { [Op.substring]: req.query.keyword } },
        { jobName: { [Op.substring]: req.query.keyword } },
        { virtualCluster: { [Op.substring]: req.query.keyword } },
      ];
    }
    if ('order' in req.query) {
      const [field, ordering] = req.query.order.split(',');
      if (
        [
          'jobName',
          'submissionTime',
          'username',
          'vc',
          'retries',
          'totalTaskNumber',
          'totalGpuNumber',
          'state',
        ].includes(field)
      ) {
        if (ordering === 'ASC' || ordering === 'DESC') {
          // different naming for username and vc
          if (field === 'username') {
            order.push(['userName', ordering]);
          } else if (field === 'vc') {
            order.push(['virtualCluster', ordering]);
          } else {
            order.push([field, ordering]);
          }
        }
      }
    }
    if (order.length === 0) {
      // default order is submissionTime,DESC
      order.push(['submissionTime', 'DESC']);
    }
  }
  const attributes = [
    'name',
    'jobName',
    'userName',
    'executionType',
    'submissionTime',
    'creationTime',
    'virtualCluster',
    'totalGpuNumber',
    'totalTaskNumber',
    'totalTaskRoleNumber',
    'retries',
    'retryDelayTime',
    'platformRetries',
    'resourceRetries',
    'userRetries',
    'completionTime',
    'appExitCode',
    'subState',
    'state',
  ];
  const data = await job.list(
    attributes,
    filters,
    tagsContainFilter,
    tagsNotContainFilter,
    order,
    offset,
    limit,
    withTotalCount,
  );
  res.json(data);
});

const get = asyncHandler(async (req, res) => {
  const data = await job.get(
    req.params.frameworkName,
    req.params.jobAttemptId ? Number(req.params.jobAttemptId) : undefined,
  );
  res.json(data);
});

const update = asyncHandler(async (req, res) => {
  const jobName = res.locals.protocol.name;
  const userName = req.user.username;
  const frameworkName = `${userName}~${jobName}`;

  // check duplicate job
  try {
    const data = await job.get(frameworkName);
    if (data != null) {
      throw createError(
        'Conflict',
        'ConflictJobError',
        `Job ${frameworkName} already exists.`,
      );
    }
  } catch (error) {
    if (error.code !== 'NoJobError') {
      throw error;
    }
  }
  await job.put(frameworkName, res.locals.protocol, req.body);
  res.status(status('Accepted')).json({
    status: status('Accepted'),
    message: `Update job ${jobName} for user ${userName} successfully.`,
  });
});

const execute = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  const data = await job.get(req.params.frameworkName);
  if (data.jobStatus.username === userName || admin) {
    await job.execute(req.params.frameworkName, req.body.value);
    res.status(status('Accepted')).json({
      status: status('Accepted'),
      message: `Execute job ${req.params.frameworkName} successfully.`,
    });
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to execute job ${req.params.frameworkName}.`,
    );
  }
});

const getConfig = asyncHandler(async (req, res) => {
  try {
    const data = await job.getConfig(req.params.frameworkName);
    return res.status(200).type('text/yaml').send(data);
  } catch (error) {
    if (error.message.startsWith('[WebHDFS] 404')) {
      throw createError(
        'Not Found',
        'NoJobConfigError',
        `Config of job ${req.params.frameworkName} is not found.`,
      );
    } else {
      throw createError.unknown(error);
    }
  }
});

const getSshInfo = asyncHandler(async (req, res) => {
  const data = await job.getSshInfo(req.params.frameworkName);
  res.json(data);
});

const addTag = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  if (req.params.frameworkName.split('~')[0] === userName || admin) {
    await job.addTag(req.params.frameworkName, req.body.value);
    res.status(status('OK')).json({
      status: status('OK'),
      message: `Add tag ${req.body.value} for job ${req.params.frameworkName} successfully.`,
    });
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to add tag to job ${req.params.frameworkName}.`,
    );
  }
});

const deleteTag = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  if (req.params.frameworkName.split('~')[0] === userName || admin) {
    await job.deleteTag(req.params.frameworkName, req.body.value);
    res.status(status('OK')).json({
      status: status('OK'),
      message: `Delete tag ${req.body.value} from job ${req.params.frameworkName} successfully.`,
    });
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to delete tag from job ${req.params.frameworkName}.`,
    );
  }
});

const getEvents = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query) {
    if ('type' in req.query) {
      filters.type = req.query.type;
    }
  }
  const attributes = [
    'uid',
    'frameworkName',
    'podUid',
    'taskroleName',
    'taskName',
    'taskIndex',
    'type',
    'reason',
    'message',
    'firstTimestamp',
    'lastTimestamp',
    'count',
    'sourceComponent',
    'sourceHost',
  ];
  const data = await job.getEvents(
    req.params.frameworkName,
    attributes,
    filters,
  );
  res.json(data);
});

const getLogs = asyncHandler(async (req, res) => {
  try {
    const data = await log.getLogListFromLogManager(
      req.params.frameworkName,
      req.params.jobAttemptId,
      req.params.taskRoleName,
      req.params.taskIndex,
      req.params.taskAttemptId,
      req.query['tail-mode'],
    );
    res.json(data);
  } catch (error) {
    logger.error(`Got error when retrieving log list, error: ${error}`);
    throw error.code === 'NoTaskLogErr'
      ? error
      : createError(
          'Internal Server Error',
          'UnknownError',
          'Failed to get log list',
        );
  }
});

// module exports
module.exports = {
  list,
  get,
  update,
  execute,
  getConfig,
  getSshInfo,
  addTag,
  deleteTag,
  getEvents,
  getLogs,
};
