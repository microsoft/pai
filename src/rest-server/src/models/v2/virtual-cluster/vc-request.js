// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const uuid = require('uuid');
const createError = require('@pai/utils/error');
const k8sSecret = require('@pai/models/kubernetes/k8s-secret');
const k8sModel = require('@pai/models/kubernetes/kubernetes');

const namespace = process.env.PAI_VC_REQUEST_NAMESPACE || 'pai-vc-request';
const requestState = {
  NEW: 'new',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// create namespace if not exists
if (process.env.NODE_ENV !== 'test') {
  k8sModel.createNamespace(namespace);
}

const createRequest = async (vcName, username, message) => {
  try {
    const item = await k8sSecret.get(namespace, vcName, { encode: 'hex' });
    const id = uuid();
    const requestString = JSON.stringify({
      id,
      username,
      message,
      state: requestState.NEW,
    });

    if (item === null) {
      await k8sSecret.create(
        namespace,
        vcName,
        {
          [id]: requestString,
        },
        { encode: 'hex' },
      );
    } else {
      item[id] = requestString;
      await k8sSecret.replace(namespace, vcName, item, { encode: 'hex' });
    }
    return id;
  } catch (err) {
    throw createError(
      'Not Found',
      'NoVirtualClusterError',
      `Vc ${vcName} not found`,
    );
  }
};

const listRequest = async (vcName) => {
  try {
    const item = await k8sSecret.get(namespace, vcName, { encode: 'hex' });
    if (item === null) {
      return [];
    }
    return Object.values(item).map((x) => JSON.parse(x));
  } catch (err) {
    throw createError(
      'Not Found',
      'NoVirtualClusterError',
      `Vc ${vcName} not found`,
    );
  }
};

const updateRequest = async (vcName, id, state) => {
  try {
    const item = await k8sSecret.get(namespace, vcName, { encode: 'hex' });

    if (item !== null && item[id]) {
      const requestObject = JSON.parse(item[id]);
      requestObject.state = state;
      item[id] = JSON.stringify(requestObject);
      await k8sSecret.replace(namespace, vcName, item, { encode: 'hex' });
    }
  } catch (err) {
    throw createError(
      'Not Found',
      'NoVirtualClusterError',
      `Vc ${vcName} not found`,
    );
  }
};

const deleteRequest = async (vcName, id) => {
  try {
    const item = await k8sSecret.get(namespace, vcName, { encode: 'hex' });

    if (item !== null && item[id]) {
      delete item[id];
      await k8sSecret.replace(namespace, vcName, item, { encode: 'hex' });
    }
  } catch (err) {
    throw createError(
      'Not Found',
      'NoVirtualClusterError',
      `Vc ${vcName} not found`,
    );
  }
};

// module exports
module.exports = {
  create: createRequest,
  list: listRequest,
  update: updateRequest,
  delete: deleteRequest,
};
