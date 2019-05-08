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
const crudUtil = require('../../util/manager/user/crudUtil');
const user = require('../../util/manager/user/user');

const crudType = 'k8sSecret';
const crudUser = crudUtil.getStorageObject(crudType);
const crudConfig = crudUser.initConfig(process.env.K8S_APISERVER_URI);

const getUser = async (username) => {
  try {
    return await crudUser.read(username, crudConfig);
  } catch (error) {
    throw error;
  }
};

const getAllUser = async () => {
  try {
    return await crudUser.readAll(crudConfig);
  } catch (error) {
    throw error;
  }
};

const createUser = async (username, value) => {
  try {
    return await crudUser.create(username, value, crudConfig);
  } catch (error) {
    throw error;
  }
};

const updateUser = async (username, value) => {
  try {
    return await crudUser.update(username, value, crudConfig);
  } catch (error) {
    throw error;
  }
};

const deleteUser = async (username) => {
  try {
    return await crudUser.remove(username, crudConfig);
  } catch (error) {
    throw error;
  }
};

const getEncryptPassword = async (userValue) => {
  try {
    await user.encryptUserPassword(userValue);
    return userValue;
  } catch (error) {
    throw error;
  }
};

// module exports
module.exports = {getUser, getAllUser, createUser, updateUser, deleteUser, getEncryptPassword};
