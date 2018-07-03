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
const userModel = require('../models/user');
const logger = require('../config/logger');
const createError = require('../util/error');

/**
 * Create / update a user.
 */
const update = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const admin = req.body.admin;
  const modify = req.body.modify;
  if (req.user.admin ||
      username === req.user.username &&
      (typeof admin === 'undefined' || !admin) && modify) {
    userModel.update(username, password, admin, modify, (err, state) => {
      if (err || !state) {
        logger.warn('update user %s failed', username);
        return res.status(500).json({
          error: 'UpdateFailed',
          message: 'update user failed',
        });
      } else {
        return res.status(201).json({
          message: 'update successfully',
        });
      }
    });
  } else {
    return res.status(401).json({
      error: 'NotAuthorized',
      message: 'not authorized',
    });
  }
};

/**
 * Remove a user.
 */
const remove = (req, res) => {
  const username = req.body.username;
  if (req.user.admin) {
    userModel.remove(username, (err, state) => {
      if (err || !state) {
        logger.warn('remove user %s failed', username);
        return res.status(500).json({
          error: 'RemoveFailed',
          message: 'remove failed',
        });
      } else {
        return res.status(200).json({
          message: 'remove successfully',
        });
      }
    });
  } else {
    return res.status(401).json({
      error: 'NotAuthorized',
      message: 'not authorized',
    });
  }
};

/**
 * Update user virtual clusters.
 */
const updateUserVc = (req, res, next) => {
  const username = req.params.username;
  const virtualClusters = req.body.virtualClusters;
  if (req.user.admin) {
    userModel.updateUserVc(username, virtualClusters, (err) => {
      if (err) {
        return next(createError.unknown(err));
      } else {
        return res.status(201).json({
          message: 'update user virtual clusters successfully',
        });
      }
    });
  } else {
    next(createError('Forbidden', 'ERR_FORBIDDEN_USER', `Non-admin is not allow to do this operation.`));
  }
};

/**
 * Update user virtual clusters.
 */
const getUserList = (req, res) => {
  if (req.user.admin) {
    userModel.getUserList((err, userList) => {
      if (err) {
        logger.warn('get user info list Error');
        if (err.message === 'UserListNotFound') {
          return res.status(500).json({
            error: 'UserListNotFound',
            message: 'could not find user list',
          });
        } else {
          return res.status(500).json({
            error: 'GetUserListError',
            message: 'get user info list error',
          });
        }
      } else {
        return res.status(200).json(userList);
      }
    });
  } else {
    return res.status(401).json({
      error: 'NotAuthorized',
      message: 'not authorized',
    });
  }
};

// module exports
module.exports = {update, remove, updateUserVc, getUserList};
