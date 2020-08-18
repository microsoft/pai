// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const storage = require('@pai/models/v2/storage');

const list = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const filterDefault = req.query.default === 'true';
  const data = await storage.list(userName, filterDefault);
  res.json(data);
});

const get = asyncHandler(async (req, res) => {
  const storageName = req.params.storageName;
  const userName = req.user.username;
  const data = await storage.get(storageName, userName);
  res.json(data);
});

// module exports
module.exports = {
  list,
  get,
};
