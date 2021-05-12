// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const axios = require("axios");
const urljoin = require("url-join");
const logger = require("@framework-state-poller/common/logger");
const config = require("@framework-state-poller/common/config");

const URI_ALERT_MANAGER = urljoin(
  config.dbConnectionStr,
  "/alert-manager/api/v1/alerts"
);

// generated alerts for state change: running, succeeded, failed, stopped, retried
const getJobStateChangeAlert = (jobName, state, retries = 0) => {
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
      logger.error("State unrecognized.");
  }

  const alerts = [
    {
      labels: {
        alertname: "PAIJobStateChange",
        severity: "warn",
        job_name: jobName,
        state: state,
        retries: retries.toString(),
      },
      annotations: {
        summary: summary,
      },
    },
  ];
  logger.info(`Successfully generated alerts for job ${jobName} ...`);

  return alerts;
};

const sendJobStateChangeAlert = async (jobName, state, retries = 0) => {
  logger.info(
    `Sending job state of ${jobName} change alert to alert-manager...`
  );
  const alerts = getJobStateChangeAlert(jobName, state, retries);

  await axios({
    method: "post",
    url: URI_ALERT_MANAGER,
    headers: {
      "Content-Type": "application/json",
    },
    data: alerts,
  });

  logger.info(
    `Successfully sent job state change alert to alert-manager for job ${jobName}`
  );
};

// module exports
module.exports = {
  sendJobStateChangeAlert,
};
