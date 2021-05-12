// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Implementation of framework-state-poller.
 */

require("module-alias/register");
const interval = require("interval-promise");
const logger = require("@framework-state-poller/common/logger");
const config = require("@framework-state-poller/common/config");
const {
  getFrameworks,
  updateFrameworkTable,
} = require("@framework-state-poller/controllers/framework");
const {
  sendJobStateChangeAlert,
} = require("@framework-state-poller/controllers/alert");

const handleJobStateChange = async (framework) => {
  // each framework may have multiple state change alerts
  const infos = [];
  logger.info(`Handling job state change of job ${framework.jobName} ...`);
  if (
    framework.notificationAtRunning &&
    !framework.notifiedAtRunning &&
    framework.state in ["RUNNING", "SUCCEEDED", "FAILED", "STOPPED"]
  ) {
    infos.push({
      stateToNotify: "RUNNING",
      fieldToUpdate: "notifiedAtRunning",
      valToUpdate: true,
    });
  }
  if (
    framework.notificationAtSucceeded &&
    !framework.notifiedAtSucceeded &&
    framework.state === "SUCCEEDED"
  ) {
    infos.push({
      stateToNotify: "SUCCEEDED",
      fieldToUpdate: "notifiedAtSucceed",
      valToUpdate: true,
    });
  }
  if (
    framework.notificationAtFailed &&
    !framework.notifiedAtFailed &&
    framework.state === "FAILED"
  ) {
    infos.push({
      stateToNotify: "FAILED",
      fieldToUpdate: "notifiedAtFailed",
      valToUpdate: true,
    });
  }
  if (
    framework.notificationAtFailed &&
    !framework.notifiedAtFailed &&
    framework.state === "STOPPED"
  ) {
    infos.push({
      stateToNotify: "STOPPED",
      fieldToUpdate: "notifiedAtStoppd",
      valToUpdate: true,
    });
  }
  if (
    framework.notificationAtRetried &&
    framework.notifiedAtRetried < framework.retries
  ) {
    infos.push({
      stateToNotify: "RETRIED",
      fieldToUpdate: "notifiedAtRetried",
      valToUpdate: framework.retries,
    });
  }

  infos.forEach((info) => {
    sendJobStateChangeAlert(framework.jobName, info.fieldToUpdate)
      .then(async (response) => {
        logger.info(
          `Successfully sent alerts for job ${framework.jobName} ...`
        );
        updateFrameworkTable(framework, info.fieldToUpdate, info.valToUpdate)
          .then((response) => {
            logger.info(
              `Successfully updated framework table for job ${framework.jobName}.`
            );
          })
          .catch((error) => {
            logger.error(
              `Failed to update framework table for job ${framework.jobName} :`,
              error
            );
          });
      })
      .catch((error) => {
        logger.error(
          `Failed to send alerts for job ${framework.jobName} :`,
          error
        );
      });
  });
};

const pollJobStateChange = async () => {
  logger.info("Getting frameworks with state change to be notified...");
  let frameworks;
  try {
    frameworks = await getFrameworks();
  } catch (error) {
    logger.error(`Failed to get frameworks`, error);
  }
  logger.info(
    `${frameworks.length} framework(s) have(s) state change to be notified.`
  );
  frameworks.forEach((framework) => {
    handleJobStateChange(framework);
  });
};

// send state change alerts
interval(pollJobStateChange, config.pollIntervalSecond * 1000, {
  stopOnError: false,
});
