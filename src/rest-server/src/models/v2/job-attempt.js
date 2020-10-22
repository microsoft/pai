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
const launcherConfig = require('@pai/config/launcher');
const logger = require('@pai/config/logger');
const databaseModel = require('@pai/utils/dbUtils');
const createError = require('@pai/utils/error');
const { encodeName } = require('@pai/models/v2/utils/name');
const {
  convertToJobAttempt,
} = require('@pai/models/v2/utils/frameworkConverter');

if (launcherConfig.enabledJobHistory) {
  const healthCheck = async () => {
    try {
      await databaseModel.ping();
      return true;
    } catch (e) {
      logger.error(e.message);
      return false;
    }
  };

  const list = async (frameworkName) => {
    const attemptData = [];
    const encodedFrameworkName = encodeName(frameworkName);

    // get latest framework from k8s API
    let framework;
    try {
      framework = await databaseModel.Framework.findOne({
        attributes: ['snapshot'],
        where: { name: encodedFrameworkName },
      });
    } catch (error) {
      logger.error(
        `error when getting framework from database: ${error.message}`,
      );
      throw error;
    }

    if (framework) {
      attemptData.push({
        ...(await convertToJobAttempt(JSON.parse(framework.snapshot))),
        isLatest: true,
      });
    } else {
      logger.warn(
        `could not get framework ${encodedFrameworkName} from database.`,
      );
      return { status: 404, data: null };
    }

    const historyFrameworks = await databaseModel.FrameworkHistory.findAll({
      attributes: ['snapshot'],
      where: { frameworkName: encodedFrameworkName },
      order: [['attemptIndex', 'ASC']],
    });

    const jobRetries = await Promise.all(
      historyFrameworks.map((row) => {
        return convertToJobAttempt(JSON.parse(row.snapshot));
      }),
    );
    attemptData.push(
      ...jobRetries.map((jobRetry) => {
        return { ...jobRetry, isLatest: false };
      }),
    );
    return { status: 200, data: attemptData };
  };

  const get = async (frameworkName, jobAttemptIndex) => {
    let attemptFramework;
    let framework;
    const encodedFrameworkName = encodeName(frameworkName);

    try {
      framework = await databaseModel.Framework.findOne({
        attributes: ['snapshot'],
        where: { name: encodedFrameworkName },
      });
    } catch (error) {
      logger.error(
        `error when getting framework from database: ${error.message}`,
      );
      throw error;
    }

    if (framework) {
      attemptFramework = JSON.parse(framework.snapshot);
    } else {
      logger.warn(
        `could not get framework ${encodedFrameworkName} from database.`,
      );
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

      if (!historyFramework) {
        throw createError(
          'Not Found',
          'NoJobError',
          `Job attempt not found in job ${frameworkName} with jobAttemptIndex ${jobAttemptIndex}`,
        );
      } else {
        attemptFramework = JSON.parse(historyFramework.snapshot);
      }
    } else if (jobAttemptIndex > attemptFramework.status.attemptStatus.id) {
      throw createError(
        'Not Found',
        'NoJobError',
        `Job attempt not found in job ${frameworkName} with jobAttemptIndex ${jobAttemptIndex}`,
      );
    }

    const attemptDetail = await convertToJobAttempt(attemptFramework);
    return { status: 200, data: { ...attemptDetail, isLatest: true } };
  };

  module.exports = {
    healthCheck,
    list,
    get,
  };
} else {
  module.exports = {
    healthCheck: () => false,
    list: () => {
      throw Error('Unexpected Call');
    },
    get: () => {
      throw Error('Unexpected Call');
    },
  };
}
