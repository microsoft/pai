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
const userModel = require('@pai/models/v2/user');
const createError = require('@pai/utils/error');
const authConfig = require('@pai/config/authn');
const groupModel = require('@pai/models/v2/group');

const getUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    const userInfo = await userModel.getUser(username);
    userInfo['admin'] = userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname);
    userInfo['virtualCluster'] = userInfo['extension']['virtualCluster'] ? userInfo['extension']['virtualCluster'] : [];
    delete userInfo['password'];
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
      userItem['admin'] = userItem.grouplist.includes(authConfig.groupConfig.adminGroup.groupname);
      userItem['virtualCluster'] = userItem['extension']['virtualCluster'] ? userItem['extension']['virtualCluster'] : [];
      delete userItem['password'];
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
    let virtualCluster = [];
    let groupType = await groupModel.getAllGroupTypeObject();
    if (authConfig.groupConfig.groupDataSource !== 'basic') {
      grouplist = await groupModel.getUserGrouplistFromExternal(username);
      req.grouplist = grouplist;
      if (grouplist && grouplist.length === 0) {
        return next(createError('Bad Request', 'NoUserError', `User ${req.params.username} is not found.`));
      }
    }
    const admin = grouplist.includes(authConfig.groupConfig.adminGroup.groupname);
    if (!admin) {
      for (const groupname of grouplist) {
        if (groupType[groupname] === 'vc') {
          virtualCluster.push(groupname);
        }
      }
    } else {
      grouplist = [];
      for (let [key, value] of Object.entries(groupType)) {
        grouplist.push(key);
        if (value === 'vc') {
          virtualCluster.push(key);
        }
      }
    }
    req.virtualCluster = virtualCluster;
    const userValue = {
      username: userData.username,
      email: userData.email,
      password: userData.oid,
      grouplist: grouplist,
      extension: {
        'virtualCluster': virtualCluster,
      },
    };
    await userModel.createUser(username, userValue);
    req.updateResult = true;
    next();
  } catch (error) {
    if (error.status === 409) {
      req.updateResult = false;
      next();
    } else {
      return next(createError.unknown(error));
    }
  }
};

const updateUserGroupListFromExternal = async (req, res, next) => {
  try {
    if (!req.updateResult) {
      const username = req.userData.username;
      let userInfo = await userModel.getUser(username);
      userInfo['grouplist'] = req.grouplist;
      userInfo['extension']['virtualCluster'] = req.virtualCluster;
      await userModel.updateUser(username, userInfo);
    }
    next();
  } catch (error) {
    return next(createError.unknown((error)));
  }
};

const createUser = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
    let groupType = await groupModel.getAllGroupTypeObject();
    let grouplist = await groupModel.virtualCluster2GroupList(req.body.virtualCluster);
    let extension = req.body.extension;
    if (req.body.admin) {
      grouplist = [];
      extension['virtualCluster'] = [];
      for (let [key, value] of Object.entries(groupType)) {
        grouplist.push(key);
        if (value === 'vc') {
          extension['virtualCluster'].push(key);
        }
      }
    } else {
      if (!grouplist.includes(authConfig.groupConfig.defaultGroup.groupname)) {
        grouplist.push(authConfig.groupConfig.defaultGroup.groupname);
      }
      extension['virtualCluster'] = req.body.virtualCluster;
      if (!extension['virtualCluster'].includes(authConfig.groupConfig.defaultGroup.groupname)) {
        extension['virtualCluster'].push(authConfig.groupConfig.defaultGroup.groupname);
      }
    }
    const username = req.body.username;
    const userValue = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      grouplist: grouplist,
      extension: extension,
    };
    await userModel.createUser(username, userValue);
    return res.status(201).json({
      message: 'User is created successfully',
    });
  } catch (error) {
    if (error.status === 409) {
      return next(createError('Conflict', 'ConflictUserError', `User name ${req.body.username} already exists.`));
    }
    return next(createError.unknown(error));
  }
};

const updateUserExtension = async (req, res, next) => {
  try {
    const username = req.params.username;
    const extensionData = req.body.extension;
    if (req.user.admin || req.user.username === username) {
      let userInfo = await userModel.getUser(username);
      for (let [key, value] of Object.entries(extensionData)) {
        userInfo['extension'][key] = value;
      }
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user extension data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown((error)));
  }
};

const updateUserVirtualCluster = async (req, res, next) => {
  try {
    const username = req.params.username;
    let grouplist = await groupModel.virtualCluster2GroupList(req.body.virtualCluster);
    let virtualCluster = req.body.virtualCluster;
    if (req.user.admin) {
      let groupType = await groupModel.getAllGroupTypeObject();
      let userInfo = await userModel.getUser(username);
      for (const groupname of userInfo['grouplist']) {
        if (groupType[groupname] && !(grouplist.includes(groupname)) && groupType[groupname] !== 'vc') {
          grouplist.push(groupname);
        }
      }
      for (const vcname of virtualCluster) {
        if (!groupType[vcname] || groupType[vcname] !== 'vc') {
          return next(createError('Bad Request', 'NoVirtualClusterError', `Virtual cluster ${vcname} not found.`));
        }
      }
      if (grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
        return next(createError('Forbidden', 'ForbiddenUserError', 'Admin\'s virtual clusters cannot be updated.'));
      }
      if (!grouplist.includes(authConfig.groupConfig.defaultGroup.groupname)) {
        grouplist.push(authConfig.groupConfig.defaultGroup.groupname);
      }
      if (!virtualCluster.includes(authConfig.groupConfig.defaultGroup.groupname)) {
        virtualCluster.push(authConfig.groupConfig.defaultGroup.groupname);
      }
      userInfo['grouplist'] = grouplist;
      userInfo['extension']['virtualCluster'] = virtualCluster;
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user virtualCluster data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown((error)));
  }
};

const updateUserGroupList = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
    const username = req.params.username;
    const vcAndGroup = groupModel.updateVirtualClusterWithGrouplist(req.body.grouplist);
    let userValue = await userModel.getUser(username);
    userValue['grouplist'] = vcAndGroup.grouplist;
    userValue['extension']['virtualCluster'] = vcAndGroup.virtualCluster;
    await userModel.updateUser(username, userValue);
    return res.status(201).json({
      message: 'update user grouplist successfully.',
    });
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown(error));
  }
};

const addGroupIntoUserGrouplist = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
    const username = req.params.username;
    const groupname = req.body.groupname;
    let userInfo = await userModel.getUser(username);
    if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      return next(createError('Forbidden', 'ForbiddenUserError', 'Admin\'s grouplist cannot be updated.'));
    }
    if (!userInfo.grouplist.includes(groupname)) {
      userInfo.grouplist.push(groupname);
    }
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: `User ${username} is added into group ${groupname}`,
    });
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown(error));
  }
};

const removeGroupIntoUserGrouplist = async (req, res, next) => {
  try {
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
    const username = req.params.username;
    const groupname = req.body.groupname;
    let userInfo = await userModel.getUser(username);
    if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      return next(createError('Forbidden', 'ForbiddenUserError', 'Admin\'s grouplist cannot be updated.'));
    }
    if (userInfo.grouplist.includes(groupname)) {
      userInfo.grouplist.splice(userInfo.grouplist.indexOf(groupname), 1);
    }
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: `User ${username} is removed from group ${groupname}`,
    });
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown(error));
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const username = req.params.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    let userValue = await userModel.getUser(username);
    let newUserValue = JSON.parse(JSON.stringify(userValue));
    newUserValue['password'] = oldPassword;
    newUserValue = await userModel.getEncryptPassword(newUserValue);
    if (req.user.admin || newUserValue['password'] === userValue['password']) {
      newUserValue['password'] = newPassword;
      await userModel.updateUser(username, newUserValue, true);
      return res.status(201).json({
        message: 'update user password successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Pls input the correct password.`));
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown((error)));
  }
};

const updateUserEmail = async (req, res, next) => {
  try {
    const username = req.params.username;
    const email = req.body.email;
    if (req.user.admin || req.user.username === username) {
      let userInfo = await userModel.getUser(username);
      userInfo['email'] = email;
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user email data successfully.',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Pls input the correct password.`));
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown((error)));
  }
};

const updateUserAdminPermission = async (req, res, next) => {
  try {
    const username = req.params.username;
    const admin = req.body.admin;
    if (!req.user.admin) {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    } else {
      let userInfo = await userModel.getUser(username);
      const existed = userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname);
      if (!existed && admin) {
        const groupInfoList = await groupModel.getAllGroup();
        let groupnameList = [];
        let virtualCluster = [];
        for (let groupItem of groupInfoList) {
          groupnameList.push(groupItem['groupname']);
          if (groupItem['extension']['groupType'] === 'vc') {
            virtualCluster.push(groupItem['groupname']);
          }
        }
        userInfo['grouplist'] = groupnameList;
        userInfo['extension']['virtualCluster'] = virtualCluster;
      } else if (existed && !admin) {
        userInfo['grouplist'].splice(userInfo['grouplist'].indexOf(authConfig.groupConfig.adminGroup.groupname), 1);
      }
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user admin permission successfully.',
      });
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown((error)));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    if (req.user.admin) {
      const userInfo = await userModel.getUser(username);
      if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
        return next(createError('Forbidden', 'RemoveAdminError', `Admin ${username} is not allowed to remove.`));
      }
      await userModel.deleteUser(username);
      return res.status(200).json({
        message: 'user is removed successfully',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allow to do this operation.`));
    }
  } catch (error) {
    if (error.status === 404) {
      return next(createError('Not Found', 'NoUserError', `User ${req.params.username} not found.`));
    }
    return next(createError.unknown((error)));
  }
};

const checkUserPassword = async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    let userValue = await userModel.getUser(username);
    let newUserValue = JSON.parse(JSON.stringify(userValue));
    newUserValue['password'] = password;
    newUserValue = await userModel.getEncryptPassword(newUserValue);
    if (newUserValue['password'] !== userValue['password']) {
      return next(createError('Bad Request', 'IncorrectPasswordError', 'Password is incorrect.'));
    }
    next();
  } catch (error) {
    if (error.status && error.status === 404) {
      return next(createError('Bad Request', 'NoUserError', `User ${req.params.username} is not found.`));
    }
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
  updateUserVirtualCluster,
  updateUserGroupList,
  updateUserEmail,
  updateUserAdminPermission,
  addGroupIntoUserGrouplist,
  removeGroupIntoUserGrouplist,
  deleteUser,
  updateUserPassword,
  createUser,
  checkUserPassword,
};
