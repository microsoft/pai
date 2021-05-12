// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { Sequelize } = require("sequelize");
const Op = Sequelize.Op;
const DatabaseModel = require("openpaidbsdk");
const logger = require("@framework-state-poller/common/logger");
const config = require("@framework-state-poller/common/config");

const databaseModel = new DatabaseModel(
  config.dbConnectionStr,
  config.maxDatabaseConnection
);

const getFrameworks = async () => {
  logger.info("Getting related frameworks from DB...");
  const frameworks = await databaseModel.Framework.findAll({
    attributes: [
      "name",
      "jobName",
      "state",
      "retries",
      "notificationAtRunning",
      "notifiedAtRunning",
      "notificationAtSucceeded",
      "notifiedAtSucceeded",
      "notificationAtFailed",
      "notifiedAtFailed",
      "notificationAtStopped",
      "notifiedAtStopped",
      "notificationAtRetried",
      "notifiedAtRetried",
    ],
    where: {
      [Op.or]: [
        {
          [Op.and]: [
            { notificationAtRunning: true },
            { notifiedAtRunning: false },
            {
              state: {
                [Op.in]: ["RUNNING", "SUCCEEDED", "FAILED", "STOPPED"],
              },
            },
          ],
        },
        {
          [Op.and]: [
            { notificationAtSucceeded: true },
            { notifiedAtSucceeded: false },
            { state: "SUCCEEDED" },
          ],
        },
        {
          [Op.and]: [
            { notificationAtFailed: true },
            { notifiedAtFailed: false },
            { state: "FAILED" },
          ],
        },
        {
          [Op.and]: [
            { notificationAtStopped: true },
            { notifiedAtStopped: false },
            { state: "STOPPED" },
          ],
        },
        {
          [Op.and]: [
            { notificationAtRetried: true },
            {
              notifiedAtRetried: {
                [Op.lt]: { [Op.col]: "retries" },
              },
            },
          ],
        },
      ],
    },
  });
  logger.info("Successfully got related frameworks from DB.");
  return frameworks;
};

const updateFrameworkTable = async (framework, field, value) => {
  logger.info(`Updating framework ${framework.name} ...`);
  await framework.update({
    field: value,
  });
  logger.info(
    `Successfully set ${field}=${value} for framework ${framework.name}.`
  );
};

// module exports
module.exports = {
  getFrameworks,
  updateFrameworkTable,
};
