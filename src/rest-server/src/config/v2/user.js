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
const Joi = require('joi');

// define the input schema for the 'update user extension' api
const userExtensionUpdateInputSchema = Joi.object().keys({
  extension: Joi.object().pattern(/\w+/, Joi.required()),
}).required();

// define the input schema for the 'update user virtualCluster' api
const userVirtualClusterUpdateInputSchema = Joi.object().keys({
  virtualCluster: Joi.array().items(Joi.string()).required(),
});

// define the input schema for the 'update user grouplist' api
const userGrouplistUpdateInputSchema = Joi.object().keys({
  grouplist: Joi.array().items(Joi.string()).required(),
});

// define the input schema for the 'update user password' api
const userPasswordUpdateInputSchema = Joi.object().keys({
  oldPassword: Joi.string().min(6).default('defaultpai'),
  newPassword: Joi.string().min(6).required(),
});

// define the input schema for the 'update user email' api
const userEmailUpdateInputSchema = Joi.object().keys({
  email: Joi.string().email().empty(''),
});

// define the input schema for the 'update user admin permission' api
const userAdminPermissionUpdateInputSchema = Joi.object().keys({
  admin: Joi.boolean().required(),
});

// define the input schema for the 'add or remove group from grouplist' api
const addOrRemoveGroupInputSchema = Joi.object().keys({
  groupname: Joi.string()
    .regex(/^[A-Za-z0-9_]+$/, 'groupname')
    .required(),
});

// define the input schema for the 'create user' api
const userCreateInputSchema = Joi.object().keys({
  username: Joi.string()
    .regex(/^[\w.-]+$/, 'username')
    .required(),
  email: Joi.string()
    .email()
    .empty(''),
  virtualCluster: Joi.array()
    .items(Joi.string())
    .default([]),
  admin: Joi.boolean()
    .default(false),
  password: Joi.string()
    .min(6)
    .required(),
  extension: Joi.object()
    .pattern(/\w+/, Joi.required())
    .default(),
});

// module exports
module.exports = {
  userExtensionUpdateInputSchema,
  userVirtualClusterUpdateInputSchema,
  userGrouplistUpdateInputSchema,
  userPasswordUpdateInputSchema,
  userEmailUpdateInputSchema,
  userCreateInputSchema,
  userAdminPermissionUpdateInputSchema,
  addOrRemoveGroupInputSchema,
};
