// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const uuid = require('uuid');
const createError = require('@pai/utils/error');
const k8sSecret = require('@pai/models/kubernetes/k8s-secret');
const k8sModel = require('@pai/models/kubernetes/kubernetes');
const { requestType, requestState } = require('@pai/config/v2/user-request');
const { encrypt } = require('@pai/utils/manager/user/user');

const namespace = process.env.PAI_REQUEST_NAMESPACE || 'pai-request';

// create namespace if not exists
if (process.env.NODE_ENV !== 'test') {
  k8sModel.createNamespace(namespace);
}

const createRequest = async (type, id, object) => {
  const item = await k8sSecret.get(namespace, type, { encode: 'hex' });
  const requestString = JSON.stringify(object);

  if (item === null) {
    await k8sSecret.create(
      namespace,
      type,
      {
        [id]: requestString,
      },
      { encode: 'hex' },
    );
  } else {
    item[id] = requestString;
    await k8sSecret.replace(namespace, type, item, { encode: 'hex' });
  }
};

const listRequest = async (type) => {
  const item = await k8sSecret.get(namespace, type, { encode: 'hex' });
  if (item === null) {
    return [];
  }
  return Object.values(item).map((x) => JSON.parse(x));
};

const updateRequestState = async (type, id, state) => {
  const item = await k8sSecret.get(namespace, type, { encode: 'hex' });

  if (item !== null && item[id]) {
    const requestObject = JSON.parse(item[id]);
    requestObject.state = state;
    item[id] = JSON.stringify(requestObject);
    await k8sSecret.replace(namespace, type, item, { encode: 'hex' });
  } else {
    throw createError(
      'Not Found',
      'NoRequestError',
      `Request ${id} not found.`,
    );
  }
};

const deleteRequest = async (type, id) => {
  const item = await k8sSecret.get(namespace, type, { encode: 'hex' });

  if (item !== null && item[id]) {
    delete item[id];
    await k8sSecret.replace(namespace, type, item, { encode: 'hex' });
  } else {
    throw createError(
      'Not Found',
      'NoRequestError',
      `Request ${id} not found.`,
    );
  }
};

const getPasswordHash = async (user) => {
  if (user && user.username && user.password) {
    return await encrypt(user.username, user.password);
  } else {
    return null;
  }
};

const create = async (type, username, body) => {
  const id = uuid();
  const requestObject = {
    type,
    id,
    username,
    message: body.message,
    state: requestState.NEW,
    requestTime: new Date(),
  };
  switch (type) {
    case requestType.VC:
      requestObject.vc = body.vc;
      break;
    case requestType.USER:
      requestObject.user = {
        username: body.user.username,
        email: body.user.email,
        passwordHash: await getPasswordHash(body.user),
      };
      break;
    case requestType.STORAGE:
      requestObject.storage = body.storage;
      break;
  }
  await createRequest(type, id, requestObject);
  return id;
};

// module exports
module.exports = {
  create,
  list: listRequest,
  update: updateRequestState,
  delete: deleteRequest,
};
