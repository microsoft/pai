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
const jwt = require('jsonwebtoken');
const userModel = require('@pai/models/v2/user');
const createError = require('@pai/utils/error');
const authConfig = require('@pai/config/authn');
const logger = require('@pai/config/logger');
const groupModel = require('@pai/models/v2/group');
const vcModel = require('@pai/models/v2/virtual-cluster');
const tokenModel = require('@pai/models/token');

const getUserVCs = async (username) => {
  const userInfo = await userModel.getUser(username);
  let virtualClusters = new Set();
  for (const group of userInfo.grouplist) {
    const groupVCs = await groupModel.getGroupVCs(group);
    virtualClusters = new Set([...virtualClusters, ...groupVCs]);
  }
  return [...virtualClusters];
};

const getUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    const userInfo = await userModel.getUser(username);
    const groupItems = await groupModel.getListGroup(userInfo.grouplist);
    userInfo.admin = groupModel.getAdminWithGroupInfo(groupItems);
    userInfo.virtualCluster = await groupModel.getVCsWithGroupInfo(groupItems);
    userInfo.storageConfig = await groupModel.getStorageConfigsWithGroupInfo(
      groupItems,
    );
    delete userInfo.password;
    return res.status(200).json(userInfo);
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Bad Request',
          'NoUserError',
          `User ${req.params.username} is not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const userList = await userModel.getAllUser();
    const groupInfo = await groupModel.getAllGroup();
    const allVClist = Object.keys(await vcModel.list());
    const groupMap = {};
    for (const groupItem of groupInfo) {
      groupMap[groupItem.groupname] = groupItem;
    }

    const retUserList = await Promise.all(
      userList.map(async (userItem) => {
        const groupItems = Array.from(
          userItem.grouplist,
          (groupname) => groupMap[groupname],
        );
        const admin = groupModel.getAdminWithGroupInfo(groupItems);
        userItem.admin = admin;
        userItem.virtualCluster = admin
          ? allVClist
          : await groupModel.getVCsWithGroupInfo(groupItems);
        userItem.storageConfig = await groupModel.getStorageConfigsWithGroupInfo(
          groupItems,
        );
        delete userItem.password;
        return userItem;
      }),
    );
    return res.status(200).json(retUserList);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// OIDC
const createUserIfUserNotExist = async (req, res, next) => {
  try {
    const userData = req.userData;
    const username = userData.username;
    let grouplist = [];
    if (authConfig.groupConfig.groupDataSource !== 'basic') {
      const data = {};
      if (authConfig.groupConfig.groupDataSource === 'ms-graph') {
        data.accessToken = req.undecodedAccessToken;
        data.graphUrl = `https://${authConfig.OIDCConfig.msgraph_host}/`;
      }
      grouplist = await groupModel.getUserGrouplistFromExternal(username, data);
      req.grouplist = grouplist;
      if (grouplist && grouplist.length === 0) {
        let forbiddenMessage = `User ${userData.username} is not in configured groups.`;
        if (authConfig.groupConfig.groupDataSource === 'ms-graph') {
          forbiddenMessage =
            forbiddenMessage +
            `Please contact your admin, and join the AAD group named [ ${authConfig.groupConfig.defaultGroup.externalName} ].`;
        }
        const forbiddenError = createError(
          'Forbidden',
          'ForbiddenUserError',
          forbiddenMessage,
        );
        forbiddenError.targetURI = req.returnBackURI;
        return next(forbiddenError);
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
      const userInfo = await userModel.getUser(username);
      userInfo.grouplist = req.grouplist;
      await userModel.updateUser(username, userInfo);
    }
    next();
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const createUser = async (req, res, next) => {
  let grouplist;
  try {
    grouplist = await groupModel.virtualCluster2GroupList(
      req.body.virtualCluster,
    );
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoGroupError',
          `No groups for vc: ${req.body.virtualCluster}`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
  if (grouplist.length !== req.body.virtualCluster.length) {
    return next(
      createError(
        'Bad Request',
        'NoVirtualClusterError',
        `Try to update: ${req.body.virtualCluster}, but found ${grouplist}`,
      ),
    );
  }
  if (!grouplist.includes(authConfig.groupConfig.defaultGroup.groupname)) {
    grouplist.push(authConfig.groupConfig.defaultGroup.groupname);
  }
  if (req.body.admin) {
    if (!grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      grouplist.push(authConfig.groupConfig.adminGroup.groupname);
    }
  }
  const username = req.body.username;
  const userValue = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    grouplist: grouplist,
    extension: req.body.extension,
  };
  try {
    await userModel.createUser(username, userValue);
  } catch (error) {
    if (error.status === 409) {
      return next(
        createError(
          'Conflict',
          'ConflictUserError',
          `User name ${req.body.username} already exists.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
  return res.status(201).json({
    message: 'User is created successfully',
  });
};

const updateExtensionInternal = async (oldExtension, newExtension) => {
  const retExtension = JSON.parse(JSON.stringify(oldExtension));
  for (const [key, value] of Object.entries(newExtension)) {
    retExtension[key] = value;
  }
  return retExtension;
};

const updateUserExtension = async (req, res, next) => {
  try {
    const username = req.params.username;
    const extensionData = req.body.extension;
    if (req.user.admin || req.user.username === username) {
      const userInfo = await userModel.getUser(username);
      userInfo.extension = await updateExtensionInternal(
        userInfo.extension,
        extensionData,
      );
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user extension data successfully.',
      });
    } else {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Non-admin is not allow to do this operation.`,
        ),
      );
    }
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoUserError',
          `User ${req.params.username} not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
};

const updateVirtualClusterInternal = async (newVc) => {
  let groupList;
  try {
    groupList = await groupModel.virtualCluster2GroupList(newVc);
  } catch (error) {
    throw createError(
      'Bad Request',
      'NoVirtualClusterError',
      `Try to update nonexist: ${newVc}`,
    );
  }
  if (groupList.length !== newVc.length) {
    throw createError(
      'Bad Request',
      'NoVirtualClusterError',
      `Try to update: ${newVc}, but found: ${groupList}`,
    );
  }
  if (!groupList.includes(authConfig.groupConfig.defaultGroup.groupname)) {
    groupList.push(authConfig.groupConfig.defaultGroup.groupname);
  }
  return groupList;
};

const updateUserVirtualCluster = async (req, res, next) => {
  try {
    const username = req.params.username;
    const newGroupList = await updateVirtualClusterInternal(
      req.body.virtualCluster,
    );
    let userInfo;
    try {
      userInfo = await userModel.getUser(username);
    } catch (error) {
      if (error.status === 404) {
        return next(
          createError(
            'Not Found',
            'NoUserError',
            `User ${req.params.username} not found.`,
          ),
        );
      }
      return next(createError.unknown(error));
    }
    if (await userModel.checkAdmin(username)) {
      return next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          "Admin's virtual clusters cannot be updated.",
        ),
      );
    }
    userInfo.grouplist = newGroupList;
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: 'Update user virtualCluster data successfully.',
    });
  } catch (error) {
    if (error.code === 'NoVirtualClusterError') {
      return next(error);
    }
    return next(createError.unknown(error));
  }
};

const updateGroupListInternal = async (groupList) => {
  const retGroupList = await groupModel.filterExistGroups(groupList);
  if (retGroupList.length !== groupList.length) {
    const nonExistGrouplist = groupList.filter(
      (groupname) => !retGroupList.includes(groupname),
    );
    throw createError(
      'Not Found',
      'NoGroupError',
      `Updated nonexistent grouplist: ${nonExistGrouplist}`,
    );
  }
  return retGroupList;
};

const updateUserGroupList = async (req, res, next) => {
  const username = req.params.username;
  let userValue;
  try {
    userValue = await userModel.getUser(username);
    userValue.grouplist = await updateGroupListInternal(req.body.grouplist);
  } catch (error) {
    if (error.code === 'NoGroupError') {
      return next(error);
    }
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoUserError',
          `User ${req.params.username} not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
  await userModel.updateUser(username, userValue);
  return res.status(201).json({
    message: 'update user grouplist successfully.',
  });
};

const addGroupIntoUserGrouplist = async (req, res, next) => {
  const existGrouplist = await groupModel.filterExistGroups([
    req.body.groupname,
  ]);
  if (existGrouplist.length === 0) {
    return next(
      createError(
        'Not Found',
        'NoGroupError',
        `Updated nonexistent group: ${req.body.groupname}`,
      ),
    );
  }
  const username = req.params.username;
  const groupname = req.body.groupname;
  let userInfo;
  try {
    userInfo = await userModel.getUser(username);
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoUserError',
          `User ${req.params.username} not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
  if (!userInfo.grouplist.includes(groupname)) {
    userInfo.grouplist.push(groupname);
  }
  await userModel.updateUser(username, userInfo);
  return res.status(201).json({
    message: `User ${username} is added into group ${groupname}`,
  });
};

const removeGroupFromUserGrouplist = async (req, res, next) => {
  try {
    const username = req.params.username;
    const groupname = req.body.groupname;
    const userInfo = await userModel.getUser(username);
    if (userInfo.grouplist.includes(groupname)) {
      userInfo.grouplist.splice(userInfo.grouplist.indexOf(groupname), 1);
    }
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: `User ${username} is removed from group ${groupname}`,
    });
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoUserError',
          `User ${req.params.username} not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const username = req.params.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    let userValue;
    try {
      userValue = await userModel.getUser(username);
    } catch (error) {
      if (error.status === 404) {
        return next(
          createError(
            'Not Found',
            'NoUserError',
            `User ${req.params.username} not found.`,
          ),
        );
      }
      return next(createError.unknown(error));
    }
    let newUserValue = JSON.parse(JSON.stringify(userValue));
    newUserValue.password = oldPassword;
    newUserValue = await userModel.getEncryptPassword(newUserValue);
    if (req.user.admin || newUserValue.password === userValue.password) {
      newUserValue.password = newPassword;
      await userModel.updateUser(username, newUserValue, true);
      // try to revoke browser tokens
      try {
        await tokenModel.batchRevoke(username, (token) => {
          const data = jwt.decode(token);
          return !data.application;
        });
      } catch (err) {
        logger.error('Failed to revoke tokens after password is updated', err);
        // pass
      }
      return res.status(201).json({
        message: 'update user password successfully.',
      });
    } else {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Pls input the correct password.`,
        ),
      );
    }
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const updateUserEmail = async (req, res, next) => {
  try {
    const username = req.params.username;
    const email = req.body.email;
    if (req.user.admin || req.user.username === username) {
      const userInfo = await userModel.getUser(username);
      userInfo.email = email;
      await userModel.updateUser(username, userInfo);
      return res.status(201).json({
        message: 'Update user email data successfully.',
      });
    } else {
      next(
        createError(
          'Forbidden',
          'ForbiddenUserError',
          `Pls input the correct password.`,
        ),
      );
    }
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoUserError',
          `User ${req.params.username} not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
};

const updateAdminPermissionInternal = async (user, admin) => {
  const groupInfo = await groupModel.getListGroup(user.grouplist);
  const existed = groupModel.getAdminWithGroupInfo(groupInfo);
  let newGroupList = [];
  if (!existed && admin) {
    // non-admin -> admin, add into adminGroup
    newGroupList = [
      ...user.grouplist,
      authConfig.groupConfig.adminGroup.groupname,
    ];
  } else if (existed && !admin) {
    // admin -> non-admin, remove from all adminGroup
    for (const groupItem of groupInfo) {
      if (!groupModel.getAdminWithGroupInfo([groupItem])) {
        newGroupList.push(groupItem.groupname);
      }
    }
  } else {
    newGroupList = user.grouplist;
  }
  return newGroupList;
};

const updateUserAdminPermission = async (req, res, next) => {
  try {
    const username = req.params.username;
    const admin = req.body.admin;
    let userInfo;
    try {
      userInfo = await userModel.getUser(username);
    } catch (error) {
      if (error.status === 404) {
        return next(
          createError(
            'Not Found',
            'NoUserError',
            `User ${req.params.username} not found.`,
          ),
        );
      }
      return next(createError.unknown(error));
    }
    userInfo.grouplist = await updateAdminPermissionInternal(userInfo, admin);
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: 'Update user admin permission successfully.',
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const checkSelf = async (req, _, next) => {
  if (req.user.username !== req.body.data.username) {
    return next(
      createError(
        'Forbidden',
        'ForbiddenUserError',
        `Can't update other user's data`,
      ),
    );
  }
  next();
};

const basicAdminUserUpdate = async (req, res, next) => {
  const username = req.body.data.username;
  let userInfo;
  try {
    userInfo = await userModel.getUser(username);
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError('Not Found', 'NoUserError', `User ${username} not found.`),
      );
    }
    return next(createError.unknown(error));
  }
  try {
    let updatePassword = false;
    if ('email' in req.body.data) {
      userInfo.email = req.body.data.email;
    }
    if ('virtualCluster' in req.body.data) {
      try {
        userInfo.grouplist = await updateVirtualClusterInternal(
          req.body.data.virtualCluster,
        );
      } catch (error) {
        if (error.code === 'NoVirtualClusterError') {
          return next(error);
        }
        return next(createError.unknown(error));
      }
    }
    if ('admin' in req.body.data) {
      userInfo.grouplist = await updateAdminPermissionInternal(
        userInfo,
        req.body.data.admin,
      );
    }
    if ('password' in req.body.data) {
      updatePassword = true;
      userInfo.password = req.body.data.password;
    }
    if ('extension' in req.body.data) {
      userInfo.extension = await updateExtensionInternal(
        userInfo.extension,
        req.body.data.extension,
      );
    }
    await userModel.updateUser(username, userInfo, updatePassword);
    if (updatePassword) {
      // try to revoke browser tokens
      try {
        await tokenModel.batchRevoke(username, (token) => {
          const data = jwt.decode(token);
          return !data.application;
        });
      } catch (err) {
        logger.error('Failed to revoke tokens after password is updated', err);
        // pass
      }
    }
    return res.status(201).json({
      message: `Update user ${username} successfully`,
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const basicUserUpdate = async (req, res, next) => {
  const username = req.user.username;
  let userInfo;
  try {
    userInfo = await userModel.getUser(username);
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError('Not Found', 'NoUserError', `User ${username} not found.`),
      );
    }
    return next(createError.unknown(error));
  }
  try {
    let updatePassword = false;
    if ('email' in req.body.data) {
      userInfo.email = req.body.data.email;
    }
    if ('password' in req.body.data) {
      let newUserValue = JSON.parse(JSON.stringify(userInfo));
      newUserValue = await userModel.getEncryptPassword(newUserValue);
      if (newUserValue.password !== userInfo.password) {
        return next(
          createError(
            'Forbidden',
            'ForbiddenUserError',
            `Pls input the correct password.`,
          ),
        );
      }
      userInfo.password = req.body.data.password;
      updatePassword = true;
    }
    if ('extension' in req.body.data) {
      userInfo.extension = await updateExtensionInternal(
        userInfo.extension,
        req.body.data.extension,
      );
    }
    await userModel.updateUser(username, userInfo, updatePassword);
    if (updatePassword) {
      // try to revoke browser tokens
      try {
        await tokenModel.batchRevoke(username, (token) => {
          const data = jwt.decode(token);
          return !data.application;
        });
      } catch (err) {
        logger.error('Failed to revoke tokens after password is updated', err);
        // pass
      }
    }
    return res.status(201).json({
      message: `Update user ${username} successfully`,
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// OIDC
// admin and other user share the same update schema in OIDC mode
const oidcUserUpdate = async (req, res, next) => {
  const username = req.user.username;
  let userInfo;
  try {
    userInfo = await userModel.getUser(username);
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError('Not Found', 'NoUserError', `User ${username} not found.`),
      );
    }
    return next(createError.unknown(error));
  }
  try {
    if ('extension' in req.body.data) {
      userInfo.extension = await updateExtensionInternal(
        userInfo.extension,
        req.body.data.extension,
      );
    }
    await userModel.updateUser(username, userInfo);
    return res.status(201).json({
      message: `Update user ${username} successfully`,
    });
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const username = req.params.username;
    if (await userModel.checkAdmin(username)) {
      return next(
        createError(
          'Forbidden',
          'RemoveAdminError',
          `Admin ${username} is not allowed to remove.`,
        ),
      );
    }
    await userModel.deleteUser(username);
    return res.status(200).json({
      message: 'user is removed successfully',
    });
  } catch (error) {
    if (error.status === 404) {
      return next(
        createError(
          'Not Found',
          'NoUserError',
          `User ${req.params.username} not found.`,
        ),
      );
    }
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {
  checkSelf,
  getUser,
  getAllUser,
  createUserIfUserNotExist,
  basicAdminUserUpdate,
  basicUserUpdate,
  oidcUserUpdate,
  updateUserGroupList,
  updateUserGroupListFromExternal,
  updateUserExtension,
  updateUserVirtualCluster,
  updateUserEmail,
  updateUserAdminPermission,
  addGroupIntoUserGrouplist,
  removeGroupFromUserGrouplist,
  deleteUser,
  updateUserPassword,
  createUser,
  getUserVCs,
};
