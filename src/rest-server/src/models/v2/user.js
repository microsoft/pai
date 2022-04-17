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
const keygen = require('ssh-keygen');
const deasync = require("deasync");

function getSSHKey(){
  let ret = null;
  const location = 'id_rsa';
  keygen({location: location}, function (err, result){
    ret = result
  });
  while ((ret == null)){
    deasync.runLoopOnce();
  }
  return ret
}

// crud user wrappers
const getUser = async (username) => {
  return await crudUser.read(username);
};

const getAllUser = async () => {
  return await crudUser.readAll();
};

const createUser = async (username, value) => {
  if (!('jobSSH' in value['extension'])){
    value['extension']['jobSSH'] = getSSHKey()
  }
  return await crudUser.create(username, value);
};

const updateUser = async (username, value, updatePassword = false) => {
  if (!('jobSSH' in value['extension'])){
    value['extension']['jobSSH'] = getSSHKey()
  }
  return await crudUser.update(username, value, updatePassword);
};

const deleteUser = async (username) => {
  return await crudUser.remove(username);
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
  return await Promise.all(
    userItems.map(async (userItem) => {
      await updateUser(userItem.username, userItem);
    }),
  );
};

const getUserVCs = async (username) => {
  const userItem = await getUser(username);
  return groupModel.getGroupsVCs(userItem.grouplist);
};

const checkAdmin = async (username) => {
  const userItem = await getUser(username);
  return groupModel.getGroupsAdmin(userItem.grouplist);
};

const checkUserVC = async (username, vcname) => {
  const userVCs = await getUserVCs(username);
  return userVCs.includes(vcname);
};

const getUserStorages = async (username, filterDefault = false) => {
  const userItem = await getUser(username);
  return groupModel.getGroupsStorages(userItem.grouplist, filterDefault);
};

const checkUserStorage = async (username, storageName) => {
  const userStorages = await getUserStorages(username);
  return userStorages.includes(storageName);
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
  getUserStorages,
  checkUserStorage,
};
