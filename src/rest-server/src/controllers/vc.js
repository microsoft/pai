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
const VirtualCluster = require('../models/vc');
const createError = require('../util/error');

/**
 * Validation, not allow operation to "default" vc.
 */
const validate = (req, res, next, vcName) => {
  if (vcName === 'default' && req.method !== 'GET') {
    return next(createError('Forbidden', 'ForbiddenUserError', `Update operation to default vc isn't allowed`));
  } else {
    return next();
  }
};

/**
 * Get all virtual clusters info.
 */
const list = (req, res, next) => {
  VirtualCluster.prototype.getVcList((vcList, err) => {
    if (err) {
      return next(createError.unknown(err));
    } else if (vcList === undefined) {
      // Unreachable
      // logger.warn('list virtual clusters error, no virtual cluster found');
      // return res.status(500).json({
      //   error: 'VirtualClusterListNotFound',
      //   message: 'could not find virtual cluster list',
      // });
    } else {
      return res.status(200).json(vcList);
    }
  });
};

/**
 * Get a vc.
 */
const get = (req, res, next) => {
  const vcName = req.params.vcName;
  VirtualCluster.prototype.getVc(vcName, (vcInfo, err) => {
    if (err) {
      return next(createError.unknown(err));
    } else {
      return res.status(200).json(vcInfo);
    }
  });
};


/**
 * Add a vc.
 */
const update = (req, res, next) => {
  const vcName = req.params.vcName;
  const vcCapacity = parseInt(req.body.vcCapacity);
  if (req.user.admin) {
    VirtualCluster.prototype.updateVc(vcName, vcCapacity, (err) => {
      if (err) {
        return next(createError.unknown(err));
      } else {
        return res.status(201).json({
          message: `update vc: ${vcName} to capacity: ${vcCapacity} successfully`,
        });
      }
    });
  } else {
    next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`));
  }
};


/**
 * Update vc status, changing a vc from running to stopped a vc will only prevent new job in this vc.
 */
const updateStatus = (req, res, next) => {
  const vcName = req.params.vcName;
  const vcStatus = req.body.vcStatus;
  if (req.user.admin) {
    if (vcStatus === 'stopped') {
      VirtualCluster.prototype.stopVc(vcName, (err) => {
        if (err) {
          return next(createError.unknown(err));
        } else {
          return res.status(201).json({
            message: `stop vc ${vcName} successfully`,
          });
        }
      });
    } else if (vcStatus === 'running') {
      VirtualCluster.prototype.activeVc(vcName, (err) => {
        if (err) {
          return next(createError.unknown(err));
        } else {
          return res.status(201).json({
            message: `active vc ${vcName} successfully`,
          });
        }
      });
    } else {
      next(createError('Bad Request', 'BadConfigurationError', `Unknown vc status: ${vcStatus}`));
    }
  } else {
    next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`));
  }
};


/**
 * Remove a vc.
 */
const remove = (req, res, next) => {
  const vcName = req.params.vcName;
  if (req.user.admin) {
    VirtualCluster.prototype.removeVc(vcName, (err) => {
      if (err) {
        return next(createError.unknown(err));
      } else {
        return res.status(201).json({
          message: `remove vc: ${vcName} successfully`,
        });
      }
    });
  } else {
    next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`));
  }
};

// module exports
module.exports = {
  get,
  list,
  update,
  remove,
  updateStatus,
  validate,
};
