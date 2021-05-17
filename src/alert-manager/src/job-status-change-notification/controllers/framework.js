// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { Sequelize } = require("sequelize");
const Op = Sequelize.Op;
const DatabaseModel = require("openpaidbsdk");
const logger = require("@job-status-change-notification/common/logger");
const config = require("@job-status-change-notification/common/config");

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

const updateFrameworkTable = async (framework, infos) => {
  logger.info(
    `Updating framework ${framework.name} for job ${framework.jobName} ...`
  );
  logger.info("Infos to update:", infos)
  for (const [key, value] of Object.entries(infos)) {
    framework[key] = value;
  }
  await framework.save();
  logger.info(`Successfully updated framework ${framework.name} for job ${framework.jobName}.`);
};

// module exports
module.exports = {
  getFrameworks,
  updateFrameworkTable,
};
