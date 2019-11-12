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
const crudUtil = require('@pai/utils/manager/group/crudUtil');
const authConfig = require('@pai/config/authn');
const secretConfig = require('@pai/config/secret');
const adapter = require('@pai/utils/manager/group/adapter/externalUtil');
const config = require('@pai/config/index');
const logger = require('@pai/config/logger');
const vcModel = require('@pai/models/v2/virtual-cluster');
const k8sConfig = require('@pai/config/kubernetes');

const crudType = 'k8sSecret';
const crudGroup = crudUtil.getStorageObject(crudType);
let optionConfig = {};
if (k8sConfig.apiserver.ca) {
  optionConfig.k8sAPIServerCaFile = k8sConfig.apiserver.ca;
}
if (k8sConfig.apiserver.token) {
  optionConfig.k8sAPIServerTokenFile = k8sConfig.apiserver.token;
}

const crudConfig = crudGroup.initConfig(k8sConfig.apiserver.uri, optionConfig);

let externalName2Groupname = {};

// crud groups
const getGroup = async (groupname) => {
  return await crudGroup.read(groupname, crudConfig);
};

const getAllGroup = async () => {
  return await crudGroup.readAll(crudConfig);
};

const createGroup = async (groupname, groupValue) => {
  return await crudGroup.create(groupname, groupValue, crudConfig);
};

const updateGroup = async (groupname, groupValue) => {
  return await crudGroup.update(groupname, groupValue, crudConfig);
};

const deleteGroup = async (groupname) => {
  // TODO: workaround for circular dependencies, need redesign module structure
  const userModel = require('@pai/models/v2/user');
  const ret = await crudGroup.remove(groupname, crudConfig);
  // delete group from all user info
  let userList = await userModel.getAllUser();
  let updateUserList = [];
  for (const userItem of userList) {
    if (userItem['grouplist'].includes(groupname)) {
      userItem['grouplist'].splice(userItem['grouplist'].indexOf(groupname), 1);
      updateUserList.push(userItem);
    }
  }
  if (updateUserList.length !== 0) {
    logger.info(`Delete group ${groupname} from user list.`);
    await userModel.batchUpdateUsers(updateUserList);
  }
  return ret;
};

const getListGroup = async (grouplist) => {
  return Promise.all(grouplist.map(getGroup));
};

const batchUpdateGroups = async (groupItems) => {
  return await Promise.all(groupItems.map(async (groupItem) => {
    await updateGroup(groupItem.groupname, groupItem);
  }));
};

const getVCsWithGroupInfo = async (groupItems) => {
  let virtualClusters = new Set();
  for (const groupItem of groupItems) {
    if (groupItem.extension && groupItem.extension.acls) {
      if (groupItem.extension.acls.admin) {
        return Object.keys(await vcModel.list());
      } else if (groupItem.extension.acls.virtualClusters) {
        virtualClusters = new Set([...virtualClusters, ...groupItem.extension.acls.virtualClusters]);
      }
    }
  }
  return [...virtualClusters];
};

const getGroupVCs = async (groupname) => {
  const groupItem = await getGroup(groupname);
  return getVCsWithGroupInfo([groupItem]);
};

const getGroupsVCs = async (grouplist) => {
  const groupItems = await getListGroup(grouplist);
  return getVCsWithGroupInfo(groupItems);
};

const getStorageConfigsWithGroupInfo = async (groupItems) => {
  let storageConfigs = new Set();
  for (const groupItem of groupItems) {
    if (groupItem.extension && groupItem.extension.acls) {
      if (groupItem.extension.acls.storageConfigs) {
        storageConfigs = new Set([...storageConfigs, ...groupItem.extension.acls.storageConfigs]);
      }
    }
  }
  return [...storageConfigs];
};

const getGroupStorageConfigs = async (groupname) => {
  const groupItem = await getGroup(groupname);
  return getStorageConfigsWithGroupInfo([groupItem]);
};

const getGroupsStorageConfigs = async (grouplist) => {
  const groupItems = await getListGroup(grouplist);
  return getStorageConfigsWithGroupInfo(groupItems);
};

const getAdminWithGroupInfo = (groupItems) => {
  for (const groupItem of groupItems) {
    if (groupItem.extension && groupItem.extension.acls && groupItem.extension.acls.admin) {
      return true;
    }
  }
  return false;
};

const getGroupAdmin = async (groupname) => {
  const groupItem = await getGroup(groupname);
  return getAdminWithGroupInfo([groupItem]);
};

const getGroupsAdmin = async (grouplist) => {
  const groupItems = await getListGroup(grouplist);
  return getAdminWithGroupInfo(groupItems);
};

const addVCintoAdminGroup = async (vcname) => {
  const allGroups = await getAllGroup();
  const updateGroups = [];
  for (const groupItem of allGroups) {
    if (groupItem.extension && groupItem.extension.acls
      && groupItem.extension.acls.admin && !groupItem.extension.acls.virtualClusters.includes(vcname)) {
      groupItem.extension.acls.virtualClusters.push(vcname);
      updateGroups.push(groupItem);
    }
  }
  await batchUpdateGroups(updateGroups);
};

const deleteVCfromAllGroup = async (vcname) => {
  const allGroups = await getAllGroup();
  const updateGroups = [];
  for (const groupItem of allGroups) {
    if (groupItem.extension && groupItem.extension.acls && groupItem.extension.acls.virtualClusters.includes(vcname)) {
      groupItem.extension.acls.virtualClusters.splice(groupItem.extension.acls.virtualClusters.indexOf(vcname), 1);
      updateGroups.push(groupItem);
    }
  }
  await batchUpdateGroups(updateGroups);
};

const getUserGrouplistFromExternal = async (username, data = {}) => {
  const adapterType = authConfig.groupConfig.groupDataSource;
  const groupAdapter = adapter.getStorageObject(adapterType);
  let response = [];
  let config = {};
  if (adapterType === 'winbind') {
    config = groupAdapter.initConfig(authConfig.groupConfig.winbindServerUrl);
  } else if (adapterType === 'ms-graph') {
    config = groupAdapter.initConfig(data.graphUrl, data.accessToken);
  }
  const externalGrouplist = await groupAdapter.getUserGroupList(username, config);
  for (const externalGroupname of externalGrouplist) {
    if (externalGroupname in externalName2Groupname) {
      response.push(externalName2Groupname[externalGroupname]);
    }
  }
  response = [...new Set(response)];
  return response;
};

const createGroupIfNonExistent = async (groupname, groupValue) => {
  try {
    await getGroup(groupname);
  } catch (error) {
    if (error.status === 404) {
      await createGroup(groupname, groupValue);
      return true;
    } else {
      throw error;
    }
  }
  return false;
};

// TODO: replace updateGroup2ExnternalMapper
// const updateExternalName2Groupname = async () => {
//   const groupList = await getAllGroup();
//   externalName2Groupname.clear();
//   for (const groupItem of groupList) {
//     externalName2Groupname[groupItem.externalName] = groupItem.groupname;
//   }
// };

const filterExistGroups = async (groupList) => {
  const allGroupItems = await getAllGroup();
  const allGroupSet = new Set(Array.from(allGroupItems, (groupItem) => groupItem.groupname));
  const existGroupList = groupList.filter((groupname) => {
    return allGroupSet.has(groupname);
  });
  return existGroupList;
};

// hack for basic mode, assume every vc have a same name group
const virtualCluster2GroupList = async (virtualCluster) => {
  const groupList = await getListGroup(virtualCluster);
  const filterGroups = groupList.filter((groupItem) => {
    return groupItem.extension.acls && groupItem.extension.acls.virtualClusters
      && groupItem.extension.acls.virtualClusters.length === 1
      && groupItem.extension.acls.virtualClusters[0] === groupItem.groupname;
  });
  const vcGroups = new Set(Array.from(filterGroups, (groupItem) => groupItem.groupname));
  return virtualCluster.filter((vcname) => vcGroups.has(vcname));
};


const updateGroup2ExnternalMapper = async () => {
  try {
    logger.info('Begin to update group info.');
    const groupList = await getAllGroup();
    let newExternalName2Groupname = {};
    let update = false;
    for (const groupItem of groupList) {
      newExternalName2Groupname[groupItem.externalName] = groupItem.groupname;
    }
    if (Object.keys(newExternalName2Groupname).length !== Object.keys(externalName2Groupname).length) {
      update = true;
    }
    for (const [key, val] of Object.entries(newExternalName2Groupname)) {
      if (!(key in externalName2Groupname)) {
        update = true;
      } else if (externalName2Groupname[key] !== val) {
        update = true;
      }
      if (update) {
        break;
      }
    }
    if (update) {
      externalName2Groupname = newExternalName2Groupname;
    }
    logger.info('Update group info successfully.');
  } catch (error) {
    logger.info('Failed to update group info.');
    throw error;
  }
};

const initGrouplistInCfg = async () => {
  try {
    logger.info('Create admin group configured in configuration.');
    const adminGroup = {
      'groupname': authConfig.groupConfig.adminGroup.groupname,
      'description': authConfig.groupConfig.adminGroup.description,
      'externalName': authConfig.groupConfig.adminGroup.externalName,
      'extension': authConfig.groupConfig.adminGroup.extension,
    };
    await createGroupIfNonExistent(adminGroup.groupname, adminGroup);
    logger.info('Create admin group successfully.');
    logger.info('create default vc\'s group.');
    const defaultVCGroup = {
      'groupname': authConfig.groupConfig.defaultGroup.groupname,
      'description': authConfig.groupConfig.defaultGroup.description,
      'externalName': authConfig.groupConfig.defaultGroup.externalName,
      'extension': authConfig.groupConfig.defaultGroup.extension,
    };
    await createGroupIfNonExistent(defaultVCGroup.groupname, defaultVCGroup);
    logger.info('Create default group successfully.');
    logger.info('Create group configured in configuration.');
    for (const groupItem of authConfig.groupConfig.grouplist) {
      await createGroupIfNonExistent(groupItem.groupname, groupItem);
    }
    logger.info('Create group successfully.');
  } catch (error) {
    logger.error('Failed to create group configured in configuration.');
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

const createDefaultAdminUser = async () => {
  const userModel = require('@pai/models/v2/user');
  try {
    logger.info('Create admin user account configured in configuration.');
    const groupnameList = Array.from(authConfig.groupConfig.grouplist, (groupItem) => groupItem.groupname);
    groupnameList.push(authConfig.groupConfig.defaultGroup.groupname);
    groupnameList.push(authConfig.groupConfig.adminGroup.groupname);
    const userValue = {
      username: secretConfig.adminName,
      email: '',
      password: secretConfig.adminPass,
      grouplist: groupnameList,
      extension: {},
    };
    await userModel.createUserIfNonExistent(userValue.username, userValue);
    logger.info('Create admin user account successfully.');
  } catch (error) {
    logger.error('Failed to create admin user account configured in configuration.');
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

// TODO: update grouplist at initialization
// const updateUserGroupAndVirtualCluster = async () => {
//   try {
//     logger.info('Update User Grouplist at the start stage.');
//     logger.info('Init user list to update.');
//     let groupInfoList = await getAllGroup();
//     let groupnameList = [];
//     let userList = await userModel.getAllUser();
//     let updateUserList = [];
//     for (let groupItem of groupInfoList) {
//       groupnameList.push(groupItem['groupname']);
//     }
//     for (let userItem of userList) {
//       let updateUserGrouplist = false;
//       let userGroupList = [];
//       let newUserInfo = userItem;
//       for (let groupname of userItem['grouplist']) {
//         if (groupnameList.includes(groupname)) {
//           userGroupList.push(groupname);
//         } else {
//           updateUserGrouplist = true;
//         }
//       }
//       if (updateUserGrouplist) {
//         newUserInfo['grouplist'] = userGroupList;
//         updateUserList.push(newUserInfo);
//       }
//     }
//     if (updateUserList.length !== 0) {
//       logger.info('User list to be updated has been prepared.');
//       logger.info('Begin to update user\' group list.');
//       await Promise.all(updateUserList.map(async (userData) => {
//         await userModel.updateUser(userData['username'], userData);
//       }));
//       logger.info('Update group info successfully.');
//     } else {
//       logger.info('No user\' grouplist need to be updated.');
//     }
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.log(error);
//   }
// };

// delete non-exist vc from all groups
const deleteNonexistVCs = async () => {
  try {
    const groupInfoList = await getAllGroup();
    const vcList = await vcModel.list();
    const vcSet = new Set(Object.keys(vcList));
    for (let groupItem of groupInfoList) {
      if (groupItem.extension && groupItem.extension.acls && groupItem.extension.acls.virtualClusters) {
        const checkedVCs = groupItem.extension.acls.virtualClusters.filter((vcname) => vcSet.has(vcname));
        if (checkedVCs.length !== groupItem.extension.acls.virtualClusters.length) {
          logger.info(`Update group: ${groupItem.groupname} vc list, ` +
            `old: ${groupItem.extension.acls.virtualClusters}, new: ${checkedVCs}.`);
          groupItem.extension.acls.virtualClusters = checkedVCs;
          await updateGroup(groupItem.groupname, groupItem);
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

const syncGroupsWithVCs = async () => {
  const vcSet = new Set(Object.keys(await vcModel.list()));
  // 1. create group for existing vc
  for (const vcName of vcSet) {
    const groupItem = {
      groupname: vcName,
      description: '',
      externalName: '',
      extension: {
        acls: {
          admin: false,
          virtualClusters: [vcName],
        },
      },
    };
    const created = await createGroupIfNonExistent(groupItem.groupname, groupItem);
    if (created) {
      logger.info(`Created group for vc ${vcName}`);
    }
  }

  // 2. delete meaningless group
  const groupItems = await getAllGroup();
  const filterGroups = groupItems.filter((groupItem) => {
    return groupItem.extension.acls && groupItem.extension.acls.virtualClusters
      && groupItem.extension.acls.virtualClusters.length === 0
      && groupItem.extension.acls.admin === false;
  });
  await Promise.all(filterGroups.map(async (groupItem) => {
    await deleteGroup(groupItem.groupname);
    logger.info(`Deleted group ${groupItem.groupname}`);
  }));
};

const deleteInexistGroupFromUserlist = async () => {
  const userModel = require('@pai/models/v2/user');
  const allGroupItems = await getAllGroup();
  const allGroupSet = new Set(Array.from(allGroupItems, (groupItem) => groupItem.groupname));
  let userList = await userModel.getAllUser();
  let updateUserList = [];
  for (const userItem of userList) {
    const originGrouplist = userItem.grouplist;
    const newGrouplist = originGrouplist.filter((groupname) => {
      return allGroupSet.has(groupname);
    });
    if (originGrouplist.length !== newGrouplist.length) {
      userItem.grouplist = newGrouplist;
      updateUserList.push(userItem);
    }
  }
  if (updateUserList.length !== 0) {
    logger.info('Update User group list.');
    await userModel.batchUpdateUsers(updateUserList);
  }
};

const groupAndUserDataInit = async () => {
  // init configuration groups
  await initGrouplistInCfg();
  // delete non-exist vc group
  await deleteNonexistVCs();
  if (authConfig.authnMethod !== 'OIDC') {
    // create default admin user
    await createDefaultAdminUser();
    // fix inconsistence
    await syncGroupsWithVCs();
    await deleteInexistGroupFromUserlist();
  } else {
    // load all groupname and their external name
    await updateGroup2ExnternalMapper();
  }
  // update user info with the newest grouplist
  // await updateUserGroupAndVirtualCluster();
};

if (config.env !== 'test') {
  groupAndUserDataInit().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
  if (authConfig.authnMethod === 'OIDC') {
    setInterval(async function() {
      await updateGroup2ExnternalMapper();
    }, 600 * 1000);
  }
}

module.exports = {
  getGroup,
  getAllGroup,
  deleteGroup,
  createGroup,
  updateGroup,
  getListGroup,
  virtualCluster2GroupList,
  getUserGrouplistFromExternal,
  addVCintoAdminGroup,
  deleteVCfromAllGroup,
  getGroupAdmin,
  getGroupsAdmin,
  getAdminWithGroupInfo,
  getGroupVCs,
  getGroupsVCs,
  getVCsWithGroupInfo,
  getGroupStorageConfigs,
  getGroupsStorageConfigs,
  getStorageConfigsWithGroupInfo,
  filterExistGroups,
};
