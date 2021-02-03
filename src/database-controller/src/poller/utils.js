// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
require('module-alias/register');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

function isUnrecoverableResponse(response) {
  // indentify if the response is recoverable
  const statusCode = _.get(response, 'statusCode', 0);
  const message = _.get(response, 'body.message', '');
  if (statusCode === 413) {
    // Code 413 means Payload Too Large.
    // It happens when we PATCH a framework, and the PATCH's payload is too large.
    return true;
  } else if (
    statusCode === 500 &&
    message.indexOf(
      'code = ResourceExhausted desc = trying to send message larger than max',
    ) !== -1
  ) {
    // If we POST a large framework, Kubernetes API server will raise this error.
    return true;
  } else if (statusCode === 422) {
    // If the request is not valid, Kubernetes API server will return code 422.
    return true;
  }
  return false;
}

function generateClusterEventUpdate(snapshot, type, reason, message) {
  const frameworkName = snapshot.getName();
  const date = new Date();
  const mockedObj = {
    kind: 'Event',
    apiVersion: 'v1',
    metadata: {
      name: `mocked-event-for-${frameworkName}`,
      namespace: 'default',
      uid: uuidv4(),
      creationTimestamp: date,
    },
    involvedObject: {},
    reason: reason,
    message: message,
    firstTimestamp: date,
    lastTimestamp: date,
    count: 1,
    type: type,
  };
  return {
    uid: mockedObj.metadata.uid,
    frameworkName: frameworkName,
    type: mockedObj.type,
    reason: mockedObj.reason,
    message: mockedObj.message,
    firstTimestamp: mockedObj.firstTimestamp,
    lastTimestamp: mockedObj.lastTimestamp,
    count: mockedObj.count,
    event: JSON.stringify(mockedObj),
  };
}

module.exports = {
  isUnrecoverableResponse,
  generateClusterEventUpdate,
};
