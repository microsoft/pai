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
const secretConfig = require('../../config/secret');
const adapter =  require('../../util/manager/group/adapter/externalUtil');
const config = require('../../config/index');
const userModel = require('./user');

const crudType = 'k8sSecret';
const crudGroup = crudUtil.getStorageObject(crudType);
const crudConfig = crudGroup.initConfig(process.env.K8S_APISERVER_URI);

let externalName2Groupname = {};

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

const getUserGrouplistFromExternal = async (username) => {
  try {
    const adapterType = authConfig.groupConfig.groupDataSource;
    const groupAdapter = adapter.getStorageObject(adapterType);
    let response = [];
    if (adapterType === 'winbind') {
      const config = groupAdapter.initConfig(authConfig.groupConfig.winbindServerUrl);
      const externalGrouplist = await groupAdapter.getUserGroupList(username, config);
      for (const externalGroupname of externalGrouplist) {
        if (externalName2Groupname.has(externalGroupname)) {
          response.push(externalName2Groupname[externalGroupname]);
        }
      }
    }
    return response;
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

const createGroupIfNonExistent = async (groupname, groupValue) => {
  try {
    await getGroup(groupname);
  } catch (error) {
    if (error.status === 404) {
      await createGroup(groupname, groupValue);
    } else {
      throw error;
    }
  }
};

const updateExternalName2Groupname = async () => {
  try {
    const groupList = await getAllGroup();
    externalName2Groupname.clear();
    for (const groupItem of groupList) {
      externalName2Groupname.set(groupItem.externalName, groupItem.groupname);
    }
  } catch (error) {
    throw error;
  }
};

if (config.env !== 'test') {
  (async function() {
    try {
      const adminGroup = {
        'groupname': authConfig.groupConfig.adminGroup.groupname,
        'description': authConfig.groupConfig.adminGroup.description,
        'externalName': authConfig.groupConfig.adminGroup.externalName,
        'extension': authConfig.groupConfig.adminGroup.extension,
      };
      await createGroupIfNonExistent(adminGroup.groupname, adminGroup);
      for (const groupItem of authConfig.groupConfig.grouplist) {
        await createGroupIfNonExistent(groupItem.groupname, groupItem);
      }
    } catch (error) {
      throw error;
    }
  })();

  if (authConfig.authnMethod !== 'OIDC') {
    (async function() {
      try {
        const userValue = {
          username: secretConfig.adminName,
          email: '',
          password: secretConfig.adminPass,
          grouplist: [authConfig.groupConfig.adminGroup.groupname],
          extension: {},
        };
        await userModel.createUserIfNonExistent(userValue.username, userValue);
      } catch (error) {
        throw error;
      }
    })();
  } else {
    setInterval( async function() {
      try {
        const groupList = await getAllGroup();
        externalName2Groupname.clear();
        for (const groupItem of groupList) {
          externalName2Groupname.set(groupItem.externalName, groupItem.groupname);
        }
      } catch (error) {
        throw error;
      }
    }, 600);
  }
}

module.exports = {
  getGroup,
  getAllGroup,
  deleteGroup,
  createGroup,
  updateGroup,
  getUserGrouplistFromExternal,
  updateExternalName2Groupname,
};
