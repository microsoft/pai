// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Implementation of job-status-change-notification.
 */

require("module-alias/register");
const interval = require("interval-promise");
const logger = require("@job-status-change-notification/common/logger");
const config = require("@job-status-change-notification/common/config");
const {
  getFrameworks,
  updateFrameworkTable,
} = require("@job-status-change-notification/controllers/framework");
const {
  getJobStatusChangeAlert,
  sendAlerts,
} = require("@job-status-change-notification/controllers/alert");

const handleJobStatusChange = async (framework) => {
  // each framework may have multiple state change alerts
  const infos = [];
  logger.info(`Handling job state change of job ${framework.jobName} ...`);
  if (
    framework.notificationAtRunning &&
    !framework.notifiedAtRunning &&
    ["RUNNING", "SUCCEEDED", "FAILED", "STOPPED"].includes(framework.state)
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
      fieldToUpdate: "notifiedAtSucceeded",
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
      fieldToUpdate: "notifiedAtStopped",
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

  try {
    // generate & send alerts for one job
    const alerts = infos.map((info) =>
      getJobStatusChangeAlert(
        framework.jobName,
        framework.userName,
        info.stateToNotify,
        framework.retries
      )
    );
    await sendAlerts(alerts);

    // update Framework table for one job
    const updateInfos = {};
    infos.forEach((info) => {
      updateInfos[info.fieldToUpdate] = info.valToUpdate;
    });
    await updateFrameworkTable(framework, updateInfos);
  } catch (error) {
    logger.error(
      `Failed when handle job status change for job ${framework.jobName}:`,
      error
    );
  }
};

const pollJobStatusChange = async () => {
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
  const promises = frameworks.map((framework) =>
    handleJobStatusChange(framework)
  );
  for (const promise of promises) {
    await promise;
  }
};

// send state change alerts
interval(pollJobStatusChange, config.pollIntervalSecond * 1000, {
  stopOnError: false,
});
