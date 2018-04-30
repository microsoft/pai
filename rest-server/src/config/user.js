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

// define the input schema for the 'update user' api
const userPutInputSchema = Joi.object().keys({
  username: Joi.string()
    .token()
    .required(),
  password: Joi.string()
    .min(6)
    .required(),
  admin: Joi.boolean(),
  modify: Joi.boolean(),
}).required();

// define the input schema for the 'remove user' api
const userDeleteInputSchema = Joi.object().keys({
  username: Joi.string()
    .token()
    .required(),
}).required();

// define the input schema for the 'update user virtual cluster' api
const userVcUpdateInputSchema = Joi.object().keys({
  virtualClusters: Joi.string()
    .allow('')
    .regex(/^[A-Za-z0-9_,]+$/)
    .optional(),
}).required();

// module exports
module.exports = {
  userPutInputSchema: userPutInputSchema,
  userDeleteInputSchema: userDeleteInputSchema,
  userVcUpdateInputSchema: userVcUpdateInputSchema,
};
