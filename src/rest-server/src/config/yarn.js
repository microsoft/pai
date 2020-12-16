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
'use strict';


// module dependencies
const Joi = require('joi');
const httpContext = require('express-http-context');
const tokenConfig = require('@pai/config/token');

function getRequestHeaders() {
  const userToken = httpContext.get('token');
  const token = userToken || tokenConfig.adminMTToken;
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function getUpdateQueueHeaders() {
  const userToken = httpContext.get('token');
  const token = userToken || tokenConfig.adminMTToken;
  return {
    Accept: 'application/xml',
    Authorization: `Bearer ${token}`,
  };
}

// get config from environment variables
let yarnConfig = {
  yarnUri: process.env.YARN_URI,
  getRequestHeaders: getRequestHeaders,
  getUpdateQueueHeaders: getUpdateQueueHeaders,
  yarnVcInfoPath: `${process.env.YARN_URI}/ws/v1/cluster/scheduler`,
  yarnNodeInfoPath: `${process.env.YARN_URI}/ws/v1/cluster/nodes`,
  yarnVcUpdatePath: `${process.env.YARN_URI}/ws/v1/cluster/scheduler-conf`,
  yarnApplicationsPath: () => {
    return `${process.env.YARN_URI}/ws/v1/cluster/apps?user.name=mtpkrbrs`;
  },
  yarnApplicationPath: (appId) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/apps/${appId}?user.name=mtpkrbrs`;
  },
  yarnAppAttemptPath: (appId) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/apps/${appId}/appattempts?user.name=mtpkrbrs`;
  },
  yarnAppStatePath: (appId) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/apps/${appId}/state`;
  },
  yarnAppResourceRequestsPath: (appId) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/apps/${appId}/resourceRequests`;
  },
  yarnCheckUserAccessToQueue: (queue, user, queueAclType) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/queues/${queue}/access?user=${user}&queue-acl-type=${queueAclType}&user.name=mtpkrbrs`;
  },
  yarnUserGroupsPath: (user) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/users/${user}/groups?user.name=mtpkrbrs`;
  },
  yarnAppPagePath: (appId) => {
    return `${process.env.YARN_URI}/cluster/app/${appId}`;
  },
  yarnAppGroupPath: (appGroup) => {
    return `${process.env.YARN_URI}/ws/v1/cluster/appgroups/${appGroup}`;
  },
};


const yarnConfigSchema = Joi.object().keys({
  yarnUri: Joi.string()
    .uri()
    .required(),
  getRequestHeaders: Joi.func().arity(0)
    .required(),
  getUpdateQueueHeaders: Joi.func().arity(0)
    .required(),
  yarnVcInfoPath: Joi.string()
    .uri()
    .required(),
  yarnNodeInfoPath: Joi.string()
    .uri()
    .required(),
  yarnVcUpdatePath: Joi.string()
    .uri()
    .required(),
  yarnApplicationsPath: Joi.func()
    .arity(0)
    .required(),
  yarnApplicationPath: Joi.func()
    .arity(1)
    .required(),
  yarnAppAttemptPath: Joi.func()
    .arity(1)
    .required(),
  yarnAppStatePath: Joi.func()
    .arity(1)
    .required(),
  yarnAppResourceRequestsPath: Joi.func()
    .arity(1)
    .required(),
  yarnCheckUserAccessToQueue: Joi.func()
    .arity(3)
    .required(),
  yarnUserGroupsPath: Joi.func()
    .arity(1)
    .required(),
  yarnAppPagePath: Joi.func()
    .arity(1)
    .required(),
  yarnAppGroupPath: Joi.func()
    .arity(1)
    .required(),
}).required();

const {error, value} = Joi.validate(yarnConfig, yarnConfigSchema);
if (error) {
  throw new Error(`yarn config error\n${error}`);
}
yarnConfig = value;


module.exports = yarnConfig;
