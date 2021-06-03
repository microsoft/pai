// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const axios = require("axios");
const urljoin = require("url-join");
const logger = require("@job-status-change-notification/common/logger");
const config = require("@job-status-change-notification/common/config");

const URI_ALERT_MANAGER = urljoin(
  config.paiUri,
  "/alert-manager/api/v1/alerts"
);

// generated alerts for state change: running, succeeded, failed, stopped, retried
const getJobStatusChangeAlert = (jobName, userName, state, retries = 0) => {
  logger.info(`Generating alerts for job ${jobName} ...`);
  let summary;
  switch (state) {
    case "RUNNING":
      summary = `The job ${jobName} has started running.`;
      break;
    case "SUCCEEDED":
      summary = `The job ${jobName} has succeeded.`;
      break;
    case "FAILED":
      summary = `The job ${jobName} has failed.`;
      break;
    case "STOPPED":
      summary = `The job ${jobName} has been stopped.`;
      break;
    case "RETRIED":
      summary = `The job ${jobName} has retried for ${retries} time(s).`;
      break;
    default:
      logger.error(`State ${state} unrecognized.`);
  }

  const alert = {
    labels: {
      alertname: "PAIJobStatusChange",
      severity: "warn",
      job_name: jobName,
      username: userName,
      state: state,
      retries: retries.toString(),
    },
    annotations: {
      summary: summary,
    },
  };
  logger.info(`Successfully generated alerts for job ${jobName} ...`);

  return alert;
};

const sendAlerts = async (alerts) => {
  logger.info(`Sending alerts...`);

  await axios({
    method: "post",
    url: URI_ALERT_MANAGER,
    headers: {
      "Content-Type": "application/json",
    },
    data: alerts,
  });

  logger.info(`Successfully sent alerts`);
};

// module exports
module.exports = {
  getJobStatusChangeAlert,
  sendAlerts,
};
