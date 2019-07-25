// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// module dependencies
const status = require('statuses');
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const virtualCluster = require('@pai/models/v2/virtual-cluster');
const createError = require('@pai/utils/error');


const validate = (req, res, next, virtualClusterName) => {
  if (! /^[A-Za-z0-9_]+$/.test(virtualClusterName)) {
    throw createError('Bad Request', 'InvalidParametersError', 'VC name should only contain alpha-numeric and underscore characters');
  } else if (virtualCluster === 'default' && req.method !== 'GET') {
    throw createError('Forbidden', 'ForbiddenUserError', 'Update operation to default vc isn\'t allowed');
  } else {
    return next();
  }
};

const list = asyncHandler(async (req, res) => {
  const data = await virtualCluster.list();
  res.status(status('OK')).json(data);
});

const get = asyncHandler(async (req, res) => {
  const data = await virtualCluster.get(req.params.virtualClusterName);
  res.status(status('OK')).json(data);
});

const getResourceUnits = (req, res) => {
  let data;
  try {
    data = virtualCluster.getResourceUnits();
  } catch (err) {
    return createError.unknown(err);
  }
  return res.status(status('OK')).json(data);
};

const update = asyncHandler(async (req, res) => {
  const virtualClusterName = req.params.virtualClusterName;
  const capacity = parseInt(req.body.vcCapacity);
  const maxCapacity = req.body.vcMaxCapacity ? parseInt(req.body.vcMaxCapacity) : capacity;
  if (req.user.admin) {
    await virtualCluster.update(virtualClusterName, capacity, maxCapacity);
    res.status('Created').json({
      status: status('Created'),
      message: `Update virtual cluster ${virtualClusterName} to capacity ${capacity} successfully.`,
    });
  } else {
    throw createError('Forbidden', 'ForbiddenUserError', 'Non-admin is not allowed to do this operation.');
  }
});

const updateStatus = asyncHandler(async (req, res) => {
  const virtualClusterName = req.params.virtualClusterName;
  const status = req.body.vcStatus;
  if (req.user.admin) {
    if (status === 'stopped') {
      await virtualCluster.stop(virtualClusterName);
      res.status('Created').json({
        status: status('Created'),
        message: `Stop virtual cluster ${virtualClusterName} successfully.`,
      });
    } else if (status === 'running') {
      await virtualCluster.activate(virtualClusterName);
      res.status('Created').json({
        status: status('Created'),
        message: `Activate virtual cluster ${virtualClusterName} successfully.`,
      });
    } else {
      throw createError('Bad Request', 'BadConfigurationError', `Unknown vc status: ${status}`);
    }
  } else {
    throw createError('Forbidden', 'ForbiddenUserError', 'Non-admin is not allowed to do this operation.');
  }
});

const remove = asyncHandler(async (req, res) => {
  const virtualClusterName = req.params.virtualClusterName;
  if (req.user.admin) {
    await virtualCluster.remove(virtualClusterName);
    res.status('Created').json({
      status: status('Created'),
      message: `Remove virtual cluster ${virtualClusterName} successfully.`,
    });
  } else {
    throw createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`);
  }
});

// module exports
module.exports = {
  validate,
  list,
  get,
  getResourceUnits,
  update,
  updateStatus,
  remove,
};
