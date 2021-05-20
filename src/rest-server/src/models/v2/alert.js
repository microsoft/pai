// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const status = require('statuses');
const launcherConfig = require('@pai/config/launcher');
const createError = require('@pai/utils/error');
var urljoin = require('url-join');
const axios = require('axios');

const checkUserRelatedAlert = (alert, userName) => {
  // the alert should contain both 'job_name' & 'username' as labels
  if (
    'job_name' in alert.labels &&
    'username' in alert.labels &&
    alert.labels.username === userName
  ) {
    return true;
  }
  return false;
};

const list = async (isAdmin, userName) => {
  let response;
  var config = {
    method: 'get',
    url: urljoin(
      launcherConfig.alertManagerUrl,
      'api/v1/alerts?silenced=false&inhibited=false',
    ),
    headers: {},
  };

  try {
    response = await axios(config);
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status !== status('OK')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
  const alerts = response.data.data;
  if (isAdmin) {
    return alerts;
  } else {
    const userRelatedAlerts = alerts.filter((alert) =>
      checkUserRelatedAlert(alert, userName),
    );
    return userRelatedAlerts;
  }
};

// module exports
module.exports = {
  list,
};
