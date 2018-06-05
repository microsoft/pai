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

/**
 * Create / update a user.
 */
const update = (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const admin = req.body.admin;
  const modify = req.body.modify;
  if (req.user.admin ||
      username === req.user.username &&
      (typeof admin === 'undefined' || !admin) && modify) {
    userModel.update(username, password, admin, modify, (err, state) => {
      if (err || !state) {
        const error = err || new Error('update user failed');
        error.status = 500;
        next(error);
      } else {
        return res.status(201).json({
          message: 'update successfully',
        });
      }
    });
  } else {
    const error = new Error('not authorized');
    error.status = 401;
    next(error);
  }
};

/**
 * Remove a user.
 */
const remove = (req, res, next) => {
  const username = req.body.username;
  if (req.user.admin) {
    userModel.remove(username, (err, state) => {
      if (err || !state) {
        const error = err || new Error('remove failed');
        error.status = 500;
        next(error);
      } else {
        return res.status(200).json({
          message: 'remove successfully',
        });
      }
    });
  } else {
    const error = new Error('not authorized');
    error.status = 401;
    next(error);
  }
};

/**
 * Update user virtual clusters.
 */
const updateUserVc = (req, res, next) => {
  const username = req.params.username;
  const virtualClusters = req.body.virtualClusters;
  if (req.user.admin) {
    userModel.updateUserVc(username, virtualClusters, (err, state) => {
      if (err || !state) {
        if (err.message === 'InvalidVirtualCluster') {
          err.status = 500;
          err.message = `update virtual cluster failed: could not find virtual cluster ${virtualClusters}`;
          next(err);
        } else {
          const error = err || new Error('update user virtual cluster failed');
          error.status = 500;
          next(error);
        }
      } else {
        return res.status(201).json({
          message: 'update user virtual clusters successfully',
        });
      }
    });
  } else {
    const error = new Error('not authorized');
    error.status = 401;
    next(error);
  }
};

// module exports
module.exports = {update, remove, updateUserVc};
