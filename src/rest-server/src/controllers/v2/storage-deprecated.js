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
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const createError = require('@pai/utils/error');
const { get, list } = require('@pai/models/v2/storage');
const { getUserStorages } = require('@pai/models/v2/user');

const convertConfig = (storage, userDefaultStorages) => {
  const config = {
    name: storage.name,
    default: userDefaultStorages.includes(storage.name),
    servers: [storage.volumeName],
    mountInfos: [
      {
        mountPoint: `/mnt/${storage.name}`,
        path: storage.share === false ? '${PAI_USER_NAME}' : '', // eslint-disable-line no-template-curly-in-string
        server: storage.volumeName,
        permission: 'rw',
      },
    ],
  };
  return config;
};

const convertServer = async (storage) => {
  const detail = await get(storage.name);
  const server = {
    spn: storage.volumeName,
    type: detail.type.toLowerCase(),
    data: {},
    extension: {},
  };
  if (server.type === 'nfs') {
    server.data = {
      address: detail.data.server,
      rootPath: detail.data.path,
    };
  } else if (server.type === 'samba') {
    const address = detail.data.address.replace(/^\/\//, '');
    server.data = {
      address: address.substr(0, address.indexOf('/')),
      rootPath: address.substr(1 + address.indexOf('/')),
      userName: detail.data.username,
      password: detail.data.password,
      domain: '',
    };
  } else if (server.type === 'azurefile') {
    server.data = {
      dataStore: `${detail.data.accountName}.file.core.windows.net`,
      fileShare: detail.data.shareName,
      accountName: detail.data.accountName,
      key: detail.data.accountKey,
    };
  } else if (server.type === 'azureblob') {
    server.data = {
      dataStore: '',
      containerName: detail.data.containerName,
      accountName: detail.data.accountName,
      key: detail.data.accountKey,
    };
  }
  return server;
};

const getConfig = asyncHandler(async (req, res) => {
  let names = null;
  if (req.params.name) {
    names = req.params.name;
  } else if (req.query.names) {
    names = req.query.names;
  }
  if (typeof names === 'string') {
    names = [names];
  }

  const userName = req.user.username;
  const userDefaultStorages = await getUserStorages(userName, true);
  const storages = (await list(userName)).storages
    .filter((item) => (names ? names.includes(item.name) : true))
    .map((item) => convertConfig(item, userDefaultStorages));

  if (req.params.name) {
    if (storages.length === 1) {
      res.json(storages[0]);
    } else {
      throw createError(500, 'UnknownError', 'Config not found.');
    }
  } else {
    res.json(storages);
  }
});

const getServer = asyncHandler(async (req, res) => {
  let names = null;
  if (req.params.name) {
    names = req.params.name;
  } else if (req.query.names) {
    names = req.query.names;
  }
  if (typeof names === 'string') {
    names = [names];
  }

  const userName = req.user.username;
  const storages = await Promise.all(
    (await list(userName)).storages
      .filter((item) => (names ? names.includes(item.volumeName) : true))
      .map(convertServer),
  );

  if (req.params.name) {
    if (storages.length === 1) {
      res.json(storages[0]);
    } else {
      throw createError(500, 'UnknownError', 'Server not found.');
    }
  } else {
    res.json(storages);
  }
});

// module exports
module.exports = {
  getConfig,
  getServer,
};
