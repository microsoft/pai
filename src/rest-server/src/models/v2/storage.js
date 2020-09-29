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
const status = require('statuses');
const createError = require('@pai/utils/error');
const user = require('@pai/models/v2/user');
const secret = require('@pai/models/kubernetes/k8s-secret');
const kubernetes = require('@pai/models/kubernetes/kubernetes');

const convertVolumeSummary = (pvc) => {
  return {
    name: pvc.metadata.name,
    share: pvc.metadata.labels && pvc.metadata.labels.share !== 'false',
    volumeName: pvc.spec.volumeName,
  };
};

const convertVolumeDetail = async (pvc) => {
  const storage = convertVolumeSummary(pvc);
  if (!storage.volumeName) {
    return storage;
  }

  let response;
  try {
    response = await kubernetes
      .getClient()
      .get(`/api/v1/persistentvolumes/${storage.volumeName}`);
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status !== status('OK')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }

  const pv = response.data;
  if (pv.spec.nfs) {
    storage.type = 'nfs';
    storage.data = {
      server: pv.spec.nfs.server,
      path: pv.spec.nfs.path,
    };
    storage.readOnly = pv.spec.nfs.readOnly === true;
    storage.mountOptions = pv.spec.mountOptions;
  } else if (pv.spec.azureFile) {
    storage.type = 'azureFile';
    storage.data = {
      shareName: pv.spec.azureFile.shareName,
    };
    storage.readOnly = pv.spec.azureFile.readOnly === true;
    storage.secretName = pv.spec.azureFile.secretName;
  } else if (pv.spec.flexVolume) {
    if (pv.spec.flexVolume.driver === 'azure/blobfuse') {
      storage.type = 'azureBlob';
      storage.data = {
        containerName: pv.spec.flexVolume.options.container,
      };
    } else if (pv.spec.flexVolume.driver === 'microsoft.com/smb') {
      storage.type = 'samba';
      storage.data = {
        address: pv.spec.flexVolume.options.source,
      };
    } else {
      storage.type = 'other';
      storage.data = {};
    }
    storage.readOnly = pv.spec.flexVolume.readOnly === true;
    if (pv.spec.flexVolume.secretRef) {
      storage.secretName = pv.spec.flexVolume.secretRef.name;
    }
    if (pv.spec.flexVolume.options.mountoptions) {
      storage.mountOptions = pv.spec.flexVolume.options.mountoptions.split(',');
    }
  } else if (pv.spec.csi) {
    if (pv.spec.csi.driver === 'dshuttle') {
      storage.type = 'dshuttle';
      storage.data = pv.spec.csi.volumeAttributes;
    }
    storage.readOnly = pv.spec.csi.readOnly === true;
    storage.mountOptions = pv.spec.mountOptions;
  } else {
    storage.type = 'unknown';
    storage.data = {};
    storage.readOnly = false;
  }

  if (storage.secretName) {
    const secretData = await secret.get('default', storage.secretName);
    if (storage.type === 'azureFile') {
      storage.data.accountName = secretData.azurestorageaccountname;
      storage.data.accountKey = secretData.azurestorageaccountkey;
    } else if (storage.type === 'azureBlob') {
      storage.data.accountName = secretData.accountname;
      if (secretData.accountkey) {
        storage.data.accountKey = secretData.accountkey;
      } else if (secretData.accountsastoken) {
        storage.data.accountSASToken = secretData.accountsastoken;
      }
    } else if (storage.type === 'samba') {
      storage.data.username = secretData.username;
      storage.data.password = secretData.password;
    }
  }

  return storage;
};

const list = async (userName, filterDefault = false) => {
  let response;
  try {
    response = await kubernetes
      .getClient()
      .get('/api/v1/namespaces/default/persistentvolumeclaims');
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status !== status('OK')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }

  const userStorages = userName
    ? await user.getUserStorages(userName, filterDefault)
    : undefined;
  const storages = response.data.items
    .filter((item) => item.status.phase === 'Bound')
    .filter(
      (item) =>
        userStorages === undefined || userStorages.includes(item.metadata.name),
    )
    .map(convertVolumeSummary);
  if (filterDefault) {
    storages.forEach((item) => (item.default = true));
  } else {
    const defaultStorages = userName
      ? await user.getUserStorages(userName, true)
      : [];
    storages.forEach(
      (item) => (item.default = defaultStorages.includes(item.name)),
    );
  }
  return { storages };
};

const get = async (storageName, userName) => {
  let response;
  try {
    response = await kubernetes
      .getClient()
      .get(`/api/v1/namespaces/default/persistentvolumeclaims/${storageName}`);
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK')) {
    const pvc = response.data;
    if (
      !userName ||
      (await user.checkUserStorage(userName, pvc.metadata.name))
    ) {
      return convertVolumeDetail(pvc);
    } else {
      throw createError(
        'Forbidden',
        'ForbiddenUserError',
        `User ${userName} is not allowed to access ${storageName}.`,
      );
    }
  }
  if (response.status === status('Not Found')) {
    throw createError(
      'Not Found',
      'NoStorageError',
      `Storage ${storageName} is not found.`,
    );
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

// module exports
module.exports = {
  list,
  get,
};
