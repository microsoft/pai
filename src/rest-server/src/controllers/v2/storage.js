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
const createError = require('@pai/utils/error');
const storageModel = require('@pai/models/v2/storage');
const {isArray, isEmpty} = require('lodash');

const getStorageServer = async (req, res, next) => {
  try {
    const name = req.params.name;
    const storageServerInfo = await storageModel.getStorageServer(name);
    return res.status(200).json(storageServerInfo);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const getStorageServers = async (req, res, next) => {
  try {
    const names = isEmpty(req.query.names)
      ? []
      : isArray(req.query.names)
      ? req.query.names
      : [req.query.names];
    const storageServerList = await storageModel.getStorageServers(names);
    return res.status(200).json(storageServerList);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const getStorageConfig = async (req, res, next) => {
  try {
    const name = req.params.name;
    const storageConfigInfo = await storageModel.getStorageConfig(name);
    return res.status(200).json(storageConfigInfo);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const getStorageConfigs = async (req, res, next) => {
  try {
    const names = isEmpty(req.query.names)
      ? []
      : isArray(req.query.names)
      ? req.query.names
      : [req.query.names];
    const storageConfigList = await storageModel.getStorageConfigs(names);
    return res.status(200).json(storageConfigList);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createStorageServer = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`
        )
      );
    }
    const name = req.body.spn;
    const value = {
      spn: req.body.spn,
      type: req.body.type,
      data: req.body.data,
    };
    await storageModel.createStorageServer(name, value);
    return res.status(201).json({
      message: 'Storage Server is created successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const updateStorageServer = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`
        )
      );
    }
    const name = req.body.spn;
    const value = {
      spn: req.body.spn,
      type: req.body.type,
      data: req.body.data,
    };
    await storageModel.updateStorageServer(name, value);
    return res.status(201).json({
      message: 'Storage Server is updated successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const deleteStorageServer = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`
        )
      );
    }
    const name = req.params.name;
    await storageModel.deleteStorageServer(name);
    return res.status(201).json({
      message: 'Storage Server is deleted successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createStorageConfig = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`
        )
      );
    }
    const name = req.body.name;
    const value = req.body;
    await storageModel.createStorageConfig(name, value);
    return res.status(201).json({
      message: 'Storage Config is created successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const updateStorageConfig = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`
        )
      );
    }
    const name = req.body.name;
    const value = req.body;
    await storageModel.updateStorageConfig(name, value);
    return res.status(201).json({
      message: 'Storage Config is updated successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const deleteStorageConfig = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`
        )
      );
    }
    const name = req.params.name;
    await storageModel.deleteStorageConfig(name);
    return res.status(201).json({
      message: 'Storage Config is deleted successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {
  getStorageServer,
  getStorageServers,
  getStorageConfig,
  getStorageConfigs,
  createStorageServer,
  updateStorageServer,
  deleteStorageServer,
  createStorageConfig,
  updateStorageConfig,
  deleteStorageConfig,
};
