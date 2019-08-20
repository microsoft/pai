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
const groupModel = require('@pai/models/v2/group');
const userModel = require('@pai/models/v2/user');
const common = require('@pai/utils/common');

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

const getGroupUserList = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
    const groupname = req.params.groupname;
    const allUserInfoList = await userModel.getAllUser();
    let userlist = [];
    for (const userInfo of allUserInfoList) {
      if (userInfo.grouplist.includes(groupname)) {
        userlist.push({
          username: userInfo.username,
          clusterAdmin: await userModel.checkAdmin(userInfo.username),
        });
      }
    }
    return res.status(200).json(userlist);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createGroup = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
    const groupname = req.body.groupname;
    const groupValue = {
      groupname: req.body.groupname,
      description: req.body.description,
      externalName: req.body.externalName,
      extension: req.body.extension,
    };
    await groupModel.createGroup(groupname, groupValue);
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
      for (let [key, value] of Object.entries(extensionData)) {
        groupInfo['extension'][key] = value;
      }
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

const updateGroupExtensionAttr = async (req, res, next) => {
  try {
    const groupname = req.params.groupname;
    const attrs = req.params[0].split('/');
    const updateData = req.body.data;
    if (req.user.admin) {
      const groupInfo = await groupModel.getGroup(groupname);
      groupInfo.extension = common.assignValueByKeyarray(groupInfo.extension, attrs, updateData);
      await groupModel.updateGroup(groupname, groupInfo);
      return res.status(201).json({
        message: 'Update group extension data successfully.',
      });
    } else {
      return next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Bad Request', 'NoGroupError', `Group ${req.params.groupname} is not found.`));
    }
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
  createGroup,
  getGroupUserList,
  updateGroupExtension,
  updateGroupDescription,
  updateGroupExternalName,
  deleteGroup,
  updateGroupExtensionAttr,
};
