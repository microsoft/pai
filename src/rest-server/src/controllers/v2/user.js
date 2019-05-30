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
const userModel = require('../../models/v2/user');
const createError = require('../../util/error');
const authConfig = require('../../config/authn');
const groupModel = require('../../models/v2/group');

const getUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    const userInfo = await userModel.getUser(username);
    delete userInfo['password'];
    userInfo['admin'] = userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname);
    return res.status(200).json(userInfo);
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Bad Request', 'NoUserError', `User ${req.params.username} is not found.`));
    }
    return next(createError.unknown(error));
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const userList = await userModel.getAllUser();
    let retUserList = [];
    for (let userItem of userList) {
      delete userItem['password'];
      userItem['admin'] = userItem.grouplist.includes(authConfig.groupConfig.adminGroup.groupname);
      retUserList.push(userItem);
    }
    return res.status(200).json(retUserList);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createUserIfUserNotExist = async (req, res, next) => {
  try {
    const userData = req.userData;
    const username = userData.username;
    let grouplist = [];
    if (authConfig.groupConfig.groupDataSource !== 'basic') {
      grouplist = await groupModel.updateGroup(username);
      req.grouplist = grouplist;
      if (grouplist && grouplist.length === 0) {
        return next(createError('Bad Request', 'NoUserError', `User ${req.params.username} is not found.`));
      }
    }
    const userValue = {
      username: userData.username,
      email: userData.email,
      password: userData.oid,
      grouplist: grouplist,
      extension: {},
    };
    await userModel.createUser(username, userValue);
    next();
  } catch (error) {
    if (error.status === 409) {
      next();
    } else {
      return next(createError.unknown(error));
    }
  }
};

const updateUserGroupListFromExternal = async (req, res, next) => {
  try {
    const username = req.userData.username;
    let userInfo = await userModel.getUser(username);
    userInfo['grouplist'] = req.grouplist;
    await userModel.updateUser(username, userInfo);
    next();
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const createUser = async (req, res, next) => {
  try {
    const username = req.body.username;
    const userValue = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      grouplist: req.body.grouplist,
      extension: req.body.extension,
    };
    await userModel.createUser(username, userValue);
    return res.status(201).json({
      message: 'User is created successfully',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const updateUserExtension = async (req, res, next) => {
  try {
    const username = req.params.username;
    const extensionData = req.body.extension;
    if (req.user.admin || req.user.username === username) {
      let userInfo = await userModel.getUser(username);
      userInfo['extension'] = extensionData;
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user extension data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const updateUserGroupList = async (req, res, next) => {
  try {
    const username = req.params.username;
    const grouplist = req.body.grouplist;
    // TODO: check every new group is in datastore
    let userInfo = await userModel.getUser(username);
    userInfo['grouplist'] = grouplist;
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: 'Update user grouplist data successfully.',
    });
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const username = req.params.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    let userValue = await userModel.getUser(username);
    let newUserValue = userValue;
    newUserValue['password'] = oldPassword;
    newUserValue = await userModel.getEncryptPassword(newUserValue);
    if (!req.user.admin || newUserValue['password'] !== userValue['password']) {
      next(createError('Forbidden', 'ForbiddenUserError', `Pls input the correct password.`));
    } else {
      newUserValue['password'] = newPassword;
      newUserValue = await userModel.getEncryptPassword(newUserValue);
      await userModel.updateUser(username, newUserValue);
      return res.status(201).json({
        message: 'update user password successfully.',
      });
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    if (req.user.admin) {
      await userModel.deleteUser(username);
      return res.status(200).json({
        message: 'user is removed successfully',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    return next(createError.unknown((error)));
  }
};


const checkUserPassword = async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    let userValue = await userModel.getUser(username);
    let newUserValue = userValue;
    newUserValue['password'] = password;
    newUserValue = await userModel.getEncryptPassword(newUserValue);
    // eslint-disable-next-line no-console
    console.log(newUserValue);
    // eslint-disable-next-line no-console
    console.log(userValue);
    if (newUserValue['password'] !== userValue['password']) {
      return next(createError('Forbidden', 'ForbiddenUserError', `Pls input the correct password.`));
    }
    next();
  } catch (error) {
    return next(createError.unknown((error)));
  }
};


// module exports
module.exports = {
  getUser,
  getAllUser,
  createUserIfUserNotExist,
  updateUserGroupListFromExternal,
  updateUserExtension,
  updateUserGroupList,
  deleteUser,
  updateUserPassword,
  createUser,
  checkUserPassword,
};
