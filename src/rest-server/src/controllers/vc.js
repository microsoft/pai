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
const util = require('util');
const VirtualCluster = require('@pai/models/vc');
const createError = require('@pai/utils/error');
const groupModel = require('@pai/models/v2/group');
const authConfig = require('@pai/config/authn');

/**
 * Validation, not allow operation to "default" vc.
 */
const validate = (req, res, next, vcName) => {
  if (! /^[A-Za-z0-9_]+$/.test(vcName)) {
    return next(createError('Bad Request', 'InvalidParametersError', 'VC name should only contain alpha-numeric and underscore characters'));
  } else if (vcName === 'default' && req.method !== 'GET') {
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
  const vcMaxCapacity = req.body.vcMaxCapacity ? parseInt(req.body.vcMaxCapacity) : vcCapacity;
  if (req.user.admin) {
    VirtualCluster.prototype.updateVc(vcName, vcCapacity, vcMaxCapacity, (err) => {
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
 *  Add a vc and add a group, async solution
 */
const addVCAndAddGroupAsync = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      return next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`));
    }
    if (req.params.vcName === authConfig.groupConfig.adminGroup.groupname) {
      return next(createError('Forbidden', 'ForbiddenUserError', `The name '${req.params.vcName}' is occupied by admin group.`));
    }
    try {
      await groupModel.get(req.params.vcName);
      return next(createError('Conflict', 'ConflictVcError', `Name ${req.body.username} already exists.`));
    } catch (error) {
      if (error.status !== 404) {
        return next(createError.unknown((error)));
      }
    }
    const vcName = req.params.vcName;
    const vcCapacity = parseInt(req.body.vcCapacity);
    const vcMaxCapacity = req.body.vcMaxCapacity ? parseInt(req.body.vcMaxCapacity) : vcCapacity;
    await util.promisify(VirtualCluster.prototype.updateVc)(vcName, vcCapacity, vcMaxCapacity);
    const groupname = req.params.vcName;
    const extension = {'groupType': 'vc'};
    const externalName = req.body.externalName;
    const description = req.body.description;
    const groupValue = {
      groupname: groupname,
      description: description,
      externalName: externalName,
      extension: extension,
    };
    await groupModel.createGroup(groupname, groupValue);
    return res.status(201).json({
      message: 'VC is created successfully',
    });
  } catch (error) {
    return next(createError.unknown((error)));
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

/**
 *  Remove a vc and remove a group, async solution.
 */
const removeVCAndRemoveGroupAsync = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      return next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`));
    }
    if (req.params.vcName === authConfig.groupConfig.adminGroup.groupname) {
      return next(createError('Forbidden', 'ForbiddenUserError', `The name '${req.params.vcName}' is occupied by admin group.`));
    }
    const vcName = req.params.vcName;
    await util.promisify(VirtualCluster.prototype.removeVc)(vcName);
    await groupModel.deleteGroup(vcName);
    return res.status(201).json({
      message: `Remove vc: ${vcName} successfully`,
    });
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

// module exports
module.exports = {
  get,
  list,
  update,
  addVCAndAddGroupAsync,
  remove,
  removeVCAndRemoveGroupAsync,
  updateStatus,
  validate,
};
