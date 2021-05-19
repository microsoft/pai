// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const alert = require('@pai/models/v2/alert');

const list = asyncHandler(async (req, res) => {
  const isAdmin = req.user.admin;
  const userName = req.user.username;
  const data = await alert.list(isAdmin, userName);
  res.json(data);
});

// module exports
module.exports = {
  list,
};
