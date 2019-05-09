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
const crudUtil = require('../../util/manager/group/crudUtil');
const authConfig = require('../../config/authn');
const adapter =  require('../../util/manager/group/adapter/externalUtil');
const config = require('../../config/index');

const crudType = 'k8sSecret';
const crudGroup = crudUtil.getStorageObject(crudType);
const crudConfig = crudGroup.initConfig(process.env.K8S_APISERVER_URI);

const getGroup = async (groupname) => {
  try {
    return await crudGroup.read(groupname, crudConfig);
  } catch (error) {
    throw error;
  }
};

const getAllGroup = async () => {
  try {
    return await crudGroup.readAll(crudConfig);
  } catch (error) {
    throw error;
  }
};

const deleteGroup = async (groupname) => {
  try {
    return await crudGroup.remove(groupname, crudConfig);
  } catch (error) {
    throw error;
  }
};

const createGroup = async (groupname, groupValue) => {
  try {
    return await crudGroup.create(groupname, groupValue, crudConfig);
  } catch (error) {
    throw error;
  }
};

const updateGroup = async (groupname, groupValue) => {
  try {
    return await crudGroup.update(groupname, groupValue, crudConfig);
  } catch (error) {
    throw error;
  }
};

const syncUserGroupList = async (user) => {
  try {

  } catch (error) {
    throw error;
  }
};


(async function() {
  if (config.env !== 'test') {
    for (const adminGroup of authConfig.groupConfig.adminGroup) {
      const groupname = adminGroup.groupname;
      try {
        await crudGroup.read(groupname, crudConfig);
      } catch (errorRead) {
        if (errorRead.status === 404) {
          try {
            const groupValue = {
              groupname: groupname,
              description: adminGroup.description,
              externalName: adminGroup.externalName,
              extension: adminGroup.extension,
            };
            await crudGroup.create(groupname, groupValue, crudConfig);
          } catch (errorCreate) {
            throw new Error('Failed to add a new group to storage.');
          }
        } else {
          throw new Error('Check group info storage base path failed.');
        }
      }
    }
  }
})();

module.exports = {
  getGroup,
  getAllGroup,
  deleteGroup,
  createGroup,
  updateGroup,
};
