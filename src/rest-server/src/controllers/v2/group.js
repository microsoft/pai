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
const createError = require('../../util/error');
const groupModel = require('../../models/v2/group');

const getGroup = async (req, res, next) => {
  try {
    const groupname = req.params.groupname;
    const groupInfo = await groupModel.getGroup(groupname);
    return res.status(200).json(groupInfo);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const getAllGroup = async (req, res, next) => {
  try {
    const groupList = await groupModel.getAllGroup();
    return res.status(200).json(groupList);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createGroupIfGroupNotExist = async (req, res, next) => {
  try {
    const groupData = req.groupData;
    const groupname = groupData.groupname;
    const groupValue = {
      username: groupData.groupname,
      description: groupData.description,
      externalName: groupData.externalName,
      extension: {},
    };
    await groupModel.createUser(groupname, groupValue);
    next();
  } catch (error) {
    if (error.status === 409) {
      next();
    } else {
      return next(createError.unknown(error));
    }
  }
};

const createGroup = async (req, res, next) => {
  try {
    const groupname = req.body.groupname;
    const groupValue = {
      username: req.body.groupname,
      description: req.body.description,
      externalName: req.body.externalName,
      extension: {},
    };
    await groupModel.createUser(groupname, groupValue);
    return res.status(201).json({
      message: 'group is created successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const updateGroupExtension = async (req, res, next) => {
  try {
    const groupname = req.params.groupname;
    const extensionData = req.body.extension;
    if (req.user.admin) {
      let groupInfo = await groupModel.getGroup(groupname);
      groupInfo['extension'] = extensionData;
      await groupModel.updateGroup(groupname, groupInfo);
      return res.status(201).json({
        message: 'update group extension data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const updateGroupDescription = async (req, res, next) => {
  try {
    const groupname = req.params.groupname;
    const descriptionData = req.body.description;
    if (req.user.admin) {
      let groupInfo = await groupModel.getGroup(groupname);
      groupInfo['description'] = descriptionData;
      await groupModel.updateGroup(groupname, groupInfo);
      return res.status(201).json({
        message: 'update group description data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const updateGroupExternalName = async (req, res, next) => {
  try {
    const groupname = req.params.groupname;
    const externalNameData = req.body.externalName;
    if (req.user.admin) {
      let groupInfo = await groupModel.getGroup(groupname);
      groupInfo['externalName'] = externalNameData;
      await groupModel.updateGroup(groupname, groupInfo);
      return res.status(201).json({
        message: 'update group externalNameData data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const groupname = req.params.groupname;
    if (req.user.admin) {
      await groupModel.deleteGroup(groupname);
      return res.status(200).json({
        message: 'group is removed successfully',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

// module exports
module.exports = {
  getGroup,
  getAllGroup,
  createGroupIfGroupNotExist,
  createGroup,
  updateGroupExtension,
  updateGroupDescription,
  updateGroupExternalName,
  deleteGroup,
};
