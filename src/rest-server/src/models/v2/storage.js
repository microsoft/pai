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
const crudUtil = require('@pai/utils/manager/storage/crudUtil');
const k8sConfig = require('@pai/config/kubernetes');

const crudType = 'k8sSecret';
const crudStorage = crudUtil.getStorageObject(crudType);
let optionConfig = {};
if (k8sConfig.apiserver.ca) {
  optionConfig.k8sAPIServerCaFile = k8sConfig.apiserver.ca;
}
if (k8sConfig.apiserver.token) {
  optionConfig.k8sAPIServerTokenFile = k8sConfig.apiserver.token;
}
const crudConfig = crudStorage.initConfig(
  k8sConfig.apiserver.uri,
  optionConfig
);

// crud storage wrappers
const getStorageServer = async (name) => {
  return await crudStorage.readStorageServer(name, crudConfig);
};

const getStorageServers = async (names) => {
  return await crudStorage.readStorageServers(names, crudConfig);
};

const getStorageConfig = async (name) => {
  return await crudStorage.readStorageConfig(name, crudConfig);
};

const getStorageConfigs = async (names) => {
  return await crudStorage.readStorageConfigs(names, crudConfig);
};

const createStorageServer = async (name, value) => {
  return await crudStorage.createStorageServer(name, value, crudConfig);
};

const createStorageConfig = async (name, value) => {
  return await crudStorage.createStorageConfig(name, value, crudConfig);
};

const updateStorageServer = async (name, value) => {
  return await crudStorage.updateStorageServer(name, value, crudConfig);
};

const updateStorageConfig = async (name, value) => {
  return await crudStorage.updateStorageConfig(name, value, crudConfig);
};

const deleteStorageServer = async (name) => {
  return await crudStorage.removeStorageServer(name, crudConfig);
};

const deleteStorageConfig = async (name) => {
  return await crudStorage.removeStorageConfig(name, crudConfig);
};

// module exports
module.exports = {
  getStorageServer,
  getStorageServers,
  getStorageConfig,
  getStorageConfigs,
  createStorageServer,
  createStorageConfig,
  updateStorageServer,
  updateStorageConfig,
  deleteStorageServer,
  deleteStorageConfig,
};
