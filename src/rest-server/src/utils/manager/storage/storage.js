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

const Joi = require('joi');

const storageServerSchema = Joi.object()
  .keys({
    spn: Joi.string()
      .regex(/^[A-Za-z0-9_]+$/, 'spn')
      .required(),
    type: Joi.string()
      .valid(['nfs', 'samba', 'azurefile', 'azureblob', 'hdfs', 'other'])
      .required(),
    data: Joi.alternatives()
      .when('type', {
        is: 'nfs',
        then: Joi.object({
          address: Joi.string().required(),
          rootPath: Joi.string().required(),
        }).required(),
      })
      .when('type', {
        is: 'samba',
        then: Joi.object({
          address: Joi.string().required(),
          rootPath: Joi.string().required(),
          userName: Joi.string().required(),
          password: Joi.string().required(),
          domain: Joi.string().required(),
        }).required(),
      })
      .when('type', {
        is: 'azurefile',
        then: Joi.object({
          dataStore: Joi.string().required(),
          fileShare: Joi.string().required(),
          accountName: Joi.string().required(),
          key: Joi.string().required(),
        }).required(),
      })
      .when('type', {
        is: 'azureblob',
        then: Joi.object({
          dataStore: Joi.string().optional(),
          containerName: Joi.string().required(),
          accountName: Joi.string().required(),
          key: Joi.string().required(),
        }).required(),
      })
      .when('type', {
        is: 'hdfs',
        then: Joi.object({
          namenode: Joi.string().required(),
          port: Joi.number().required(),
        }).required(),
      }),
    extension: Joi.object().optional(),
  })
  .required();

function storageServerValidate(serverValue) {
  const res = storageServerSchema.validate(serverValue, {allowUnknown: true});
  if (res['error']) {
    throw new Error(`Storage Server schema error\n${res['error']}`);
  }
  return res['value'];
}

const storageConfigSchema = Joi.object()
  .keys({
    name: Joi.string()
      .regex(/^[A-Za-z0-9_]+$/, 'spn')
      .required(),
    default: Joi.bool().default(false),
    servers: Joi.array()
      .items(Joi.string())
      .optional(),
    gpn: Joi.string().optional(),
    mountInfos: Joi.array()
      .items(
        Joi.object({
          mountPoint: Joi.string().required(),
          server: Joi.string().required(),
          path: Joi.string().required(),
          permission: Joi.string()
            .valid(['ro', 'rw'])
            .optional()
            .default('rw'),
        })
      )
      .optional(),
  })
  .required();

function storageConfigValidate(configValue) {
  const res = storageConfigSchema.validate(configValue);
  if (res['error']) {
    throw new Error(`Storage Config schema error\n${res['error']}`);
  }
  return res['value'];
}

module.exports = {
  createStorageServer: storageServerValidate,
  createStorageConfig: storageConfigValidate,
};
