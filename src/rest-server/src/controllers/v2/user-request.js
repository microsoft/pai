// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const status = require('statuses');
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const createError = require('@pai/utils/error');
const requestModel = require('@pai/models/v2/user-request');
const { requestType } = require('@pai/config/v2/user-request');

const validateId = (req, res, next, requestId) => {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      requestId,
    )
  ) {
    throw createError(
      'Bad Request',
      'InvalidParametersError',
      'Request id should be an uuid',
    );
  } else {
    return next();
  }
};

const validateType = (req, res, next, type) => {
  if (!Object.values(requestType).includes(type)) {
    throw createError(
      'Bad Request',
      'InvalidParametersError',
      `Request type must be one of ${JSON.stringify(
        Object.values(requestType),
      )}`,
    );
  } else {
    return next();
  }
};

const createRequest = asyncHandler(async (req, res) => {
  try {
    const id = await requestModel.create(
      req.body.type,
      req.user && req.user.username ? req.user.username : null,
      req.body,
    );
    res.status(status('Created')).json({
      status: status('Created'),
      message: `Create request ${id} successfully.`,
    });
  } catch (err) {
    if (err.status !== 404) {
      throw createError.unknown(err);
    } else {
      throw err;
    }
  }
});

const listRequest = asyncHandler(async (req, res) => {
  try {
    const requestType = req.params.requestType;
    const items = await requestModel.list(requestType);
    res.status(status('OK')).json({
      requests: items,
    });
  } catch (err) {
    if (err.status !== 404) {
      throw createError.unknown(err);
    } else {
      throw err;
    }
  }
});

const updateRequest = asyncHandler(async (req, res) => {
  if (req.user.admin) {
    try {
      const requestType = req.params.requestType;
      const requestId = req.params.requestId;
      await requestModel.update(requestType, requestId, req.body.state);
      res.status(status('Created')).json({
        status: status('Created'),
        message: `Update request ${requestId} successfully.`,
      });
    } catch (err) {
      if (err.status !== 404) {
        throw createError.unknown(err);
      } else {
        throw err;
      }
    }
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      'Non-admin is not allowed to do this operation.',
    );
  }
});

const deleteRequest = asyncHandler(async (req, res) => {
  if (req.user.admin) {
    try {
      const requestType = req.params.requestType;
      const requestId = req.params.requestId;
      await requestModel.delete(requestType, requestId);
      res.status(status('Created')).json({
        status: status('Created'),
        message: `Delete request ${requestId} successfully.`,
      });
    } catch (err) {
      if (err.status !== 404) {
        throw createError.unknown(err);
      } else {
        throw err;
      }
    }
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      'Non-admin is not allowed to do this operation.',
    );
  }
});

// module exports
module.exports = {
  validateId,
  validateType,
  createRequest,
  listRequest,
  updateRequest,
  deleteRequest,
};
