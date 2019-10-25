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
const k8sConfig = require('@pai/config/kubernetes');

const crudType = 'k8sSecret';
const crudUser = crudUtil.getStorageObject(crudType);
let optionConfig = {};
if (k8sConfig.apiserver.ca) {
  optionConfig.k8sAPIServerCaFile = k8sConfig.apiserver.ca;
}
if (k8sConfig.apiserver.token) {
  optionConfig.k8sAPIServerTokenFile = k8sConfig.apiserver.token;
}
const crudConfig = crudUser.initConfig(k8sConfig.apiserver.uri, optionConfig);

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

// it's an inplace encrypt!
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

const batchUpdateUsers = async (userItems) => {
  return await Promise.all(userItems.map(async (userItem) => {
    await updateUser(userItem.username, userItem);
  }));
};

const getUserVCs = async (username) => {
  const userItem = await getUser(username);
  return groupModel.getGroupsVCs(userItem.grouplist);
};

const getUserStorageConfigs = async (username) => {
  const userItem = await getUser(username);
  return groupModel.getGroupsStorageConfigs(userItem.grouplist);
};

const checkAdmin = async (username) => {
  const userItem = await getUser(username);
  return groupModel.getGroupsAdmin(userItem.grouplist);
};

const checkUserVC = async (username, vcname) => {
  const userVCs = await getUserVCs(username);
  return userVCs.includes(vcname);
};

const checkUserStorageConfig = async (username, storagConfigName) => {
  const userStorageConfigs = await getUserStorageConfigs(username);
  return userStorageConfigs.includes(storagConfigName);
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
  batchUpdateUsers,
  getUserStorageConfigs,
  checkUserStorageConfig,
};
