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
const crudUtil = require('@pai/utils/manager/user/crudUtil');
const user = require('@pai/utils/manager/user/user');
const groupModel = require('@pai/models/v2/group');


const crudType = 'k8sSecret';
const crudUser = crudUtil.getStorageObject(crudType);
const crudConfig = crudUser.initConfig(process.env.K8S_APISERVER_URI);

// crud user wrappers
const getUser = async (username) => {
  return await crudUser.read(username, crudConfig);
};

const getAllUser = async () => {
  return await crudUser.readAll(crudConfig);
};

const createUser = async (username, value) => {
  return await crudUser.create(username, value, crudConfig);
};

const updateUser = async (username, value, updatePassword = false) => {
  return await crudUser.update(username, value, crudConfig, updatePassword);
};

const deleteUser = async (username) => {
  return await crudUser.remove(username, crudConfig);
};

// it's a inplace encrypt!
const getEncryptPassword = async (userValue) => {
    await user.encryptUserPassword(userValue);
    return userValue;
};

const createUserIfNonExistent = async (username, userValue) => {
  try {
    await getUser(username);
  } catch (error) {
    if (error.status === 404) {
      await createUser(username, userValue);
    } else {
      throw error;
    }
  }
};

const getUserGrouplist = async (username) => {
  const userInfo = await getUser(username);
  return userInfo.grouplist;
};

const getUserVCs = async (username) => {
  const grouplist = await getUserGrouplist(username);
  const virtualClusters = new Set();
  for (const group of grouplist) {
    const groupInfo = await groupModel.getGroup(group);
    if (groupInfo.extension && groupInfo.extension.acls && groupInfo.extension.acls.virtualClusters) {
      virtualClusters.add(groupInfo.extension.acls.virtualClusters);
    }
  }
  return [...virtualClusters];
};

const checkInAdminGroup = (candidateList, allGroupInfo) => {
  const groupMap = {};
  for (const groupItem of allGroupInfo) {
    groupMap[groupItem.groupname] = groupItem;
  }
  let admin = false;
  for (const groupname of candidateList) {
    if (groupMap.hasOwnProperty(groupname) && groupMap[groupname].extension
      && groupMap[groupname].extension.acls && groupMap[groupname].extension.acls.admin) {
      admin = true;
      break;
    }
  }
  return admin;
};

const checkAdmin = async (username) => {
  const grouplist = await getUserGrouplist(username);
  const groupInfo = await groupModel.getAllGroup();
  return checkInAdminGroup(grouplist, groupInfo);
};

const checkUserVC = async (username, vcname) => {
  let accept = false;
  const grouplist = await getUserGrouplist(username);
  for (const group of grouplist) {
    const groupInfo = await groupModel.getGroup(group);
    if (groupInfo.extension && groupInfo.extension.acls) {
      if (groupInfo.extension.acls.admin) {
        accept = true;
        break;
      }
      if (groupInfo.extension.acls.virtualClusters && groupInfo.extension.acls.virtualClusters.includes(vcname)) {
        accept = true;
        break;
      }
    }
  }
  return accept;
};

// module exports
module.exports = {
  getUser,
  getAllUser,
  createUser,
  updateUser,
  deleteUser,
  getEncryptPassword,
  createUserIfNonExistent,
  checkUserVC,
  getUserVCs,
  checkAdmin,
  checkInAdminGroup,
};
