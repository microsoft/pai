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
const logger = require('@pai/config/logger');
const { Op } = require('sequelize');
const databaseModel = require('@pai/utils/dbUtils');
const { encodeName } = require('@pai/models/v2/utils/name');
const createError = require('@pai/utils/error');
const {
  convertToTaskDetail,
} = require('@pai/models/v2/utils/frameworkConverter');

const get = async (frameworkName, jobAttemptIndex, taskRoleName, taskIndex) => {
  // get last task attempt by querying Framework / FrameworkHistory table
  let attemptFramework;
  const encodedFrameworkName = encodeName(frameworkName);

  const framework = await databaseModel.Framework.findOne({
    attributes: ['snapshot'],
    where: { name: encodedFrameworkName },
  });

  if (framework) {
    attemptFramework = JSON.parse(framework.snapshot);
  } else {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  }

  // when attemptIndex is not the last attempt, get the framework attempt from frameworkHistory table
  if (jobAttemptIndex < attemptFramework.status.attemptStatus.id) {
    const historyFramework = await databaseModel.FrameworkHistory.findOne({
      attributes: ['snapshot'],
      where: {
        frameworkName: encodedFrameworkName,
        attemptIndex: jobAttemptIndex,
      },
    });

    if (historyFramework) {
      attemptFramework = JSON.parse(historyFramework.snapshot);
    } else {
      throw createError(
        'Not Found',
        'NoJobError',
        `Job attempt not found in job ${frameworkName} with jobAttemptIndex ${jobAttemptIndex}.`,
      );
    }
  } else if (jobAttemptIndex > attemptFramework.status.attemptStatus.id) {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job attempt not found in job ${frameworkName} with jobAttemptIndex ${jobAttemptIndex}`,
    );
  }

  // set task level info with `attemptFramework`
  let taskStatus;
  const taskRoleStatus = attemptFramework.status.attemptStatus.taskRoleStatuses.find(
    (taskRoleStatus) => taskRoleStatus.name === taskRoleName,
  );
  if (taskRoleStatus) {
    taskStatus = taskRoleStatus.taskStatuses.find(
      (taskStatus) => taskStatus.index === taskIndex,
    );
  }
  if (taskStatus === undefined) {
    throw createError(
      'Not Found',
      'NoJobError',
      `Task not found in Job ${frameworkName} with jobAttemptIndex ${jobAttemptIndex}, taskRoleName ${taskRoleName} and taskIndex ${taskIndex}.`,
    );
  }

  // get task attempt history by querying TaskHistory table
  const taskUid = taskStatus.instanceUID;
  let taskHistories;
  try {
    taskHistories = await databaseModel.TaskHistory.findAll({
      attributes: ['snapshot'],
      where: {
        [Op.and]: [
          { taskUid: taskUid },
          {
            taskAttemptIndex: {
              [Op.lt]: taskStatus.attemptStatus.id,
            },
          },
        ],
      },
      order: [['taskAttemptIndex', 'DESC']],
    });
  } catch (error) {
    logger.error(`error when getting task from database: ${error.message}`);
    throw error;
  }

  if (taskHistories) {
    taskHistories = taskHistories.map((taskHistory) =>
      JSON.parse(taskHistory.snapshot),
    );
  }

  const taskDetail = await convertToTaskDetail(
    attemptFramework,
    taskRoleName,
    taskStatus,
    taskHistories,
  );
  return { status: 200, data: taskDetail };
};

module.exports = {
  get,
};
