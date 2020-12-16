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
const fse = require('fs-extra');
const Joi = require('joi');
const dotenv = require('dotenv');
const mustache = require('mustache');


require.extensions['.mustache'] = (module, filename) => {
  module.exports = fse.readFileSync(filename, 'utf8');
};

dotenv.config();

mustache.escape = (string) => {
  // https://stackoverflow.com/questions/15783701/which-characters-need-to-be-escaped-when-using-bash/27817504#27817504
  return String(string)
    /* eslint-disable no-control-regex */
    .replace(/[\x20-\x24\x26-\x2A\x2C\x3B\x3C\x3E\x3F\x5B-\x5E\x60\x7B-\x7E]/g, '\\$&')
    .replace(/[\x00-\x1F\x7F]/g, (c) => ({
      /* eslint-enable no-control-regex */
      0x07: '\\a',
      0x08: '\\b',
      0x09: '\\t',
      0x0A: '\\n',
      0x0B: '\\v',
      0x0C: '\\f',
      0x0D: '\\r',
      0x1B: '\\E',
    }[c.charCodeAt(0)] || ''));
};


const convertJobTagTypeDict = (jobTagTypeDescription) => {
  if (!jobTagTypeDescription) {
    return new Map();
  } else {
    let tempMap = new Map();
    jobTagTypeDescription.split('|').map((des) => {
      let item = JSON.parse(des);
      tempMap.set(item.tag, item.type);
    });
    return tempMap;
  }
};

const convertUserStorageAddr = (userStorageType, zkConnectionStr, k8sUri) => {
  if (userStorageType === 'zookeeper') {
    return zkConnectionStr;
  } else {
    return k8sUri;
  }
};

// get config from environment variables
let config = {
  env: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  serverPort: process.env.SERVER_PORT,
  serverProtocol: process.env.SERVER_PROTOCOL,
  jwtSecret: process.env.JWT_SECRET,
  serviceName: process.env.SERVICE_NAME,
  jobDriverTag: process.env.JOB_DRIVER_TAG,
  webportalUri: process.env.WEBPORTAL_URI,
  fileUploadMethod: process.env.FILE_UPLOAD_METHOD,
  dataCenter: process.env.DATA_CENTER,
  subCluster: process.env.SUBCLUSTER,
  jobRefreshInterval: process.env.JOB_REFRESH_INTERVAL,
  jobTagTypeMap: convertJobTagTypeDict(process.env.JOB_TAG_TYPE_DESCRIPTION),
  userStorageType: process.env.USER_STORAGE_TYPE,
  userStorageAddr: convertUserStorageAddr(process.env.USER_STORAGE_TYPE, process.env.ZOOKEEPER_CONNECTION_STR, process.env.K8S_APISERVER_URI),
  defaultJsonSchemaServer: process.env.DEFAULT_JASONSCHEMA_SERVER,
  subClusters: process.env.SUB_CLUSTERS,
  apiGatewayDomainName: process.env.API_GATEWAY_DOMAIN_NAME,
  enableGroupIdCompatibility: process.env.ENABLE_GROUPID_COMPATIBILITY,
};

// define config schema
const configSchema = Joi.object().keys({
  env: Joi.string()
    .allow(['test', 'development', 'production'])
    .default('development'),
  logLevel: Joi.string()
    .allow(['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
    .default('debug'),
  serverPort: Joi.number()
    .integer()
    .min(80)
    .max(65535)
    .default(88),
  serverProtocol: Joi.string()
    .allow(['http', 'https'])
    .default('http'),
  jwtSecret: Joi.string()
    .optional()
    .description('JWT Secret required to sign'),
  serviceName: Joi.string()
    .allow(['MT', 'PAI']),
  jobDriverTag: Joi.string()
    .allow(['MPJD']),
  webportalUri: Joi.string(),
  fileUploadMethod: Joi.string()
    .allow(['HTTPFS', 'WEBHDFS'])
    .default('HTTPFS'),
  dataCenter: Joi.string()
    .allow(['BASIC-BN2', 'BASIC-CH1B', 'BASIC-CO4', 'MTPRIME-CO4']),
  subCluster: Joi.string(),
  jobRefreshInterval: Joi.number()
    .integer()
    .default(60),
  jobTagTypeMap: Joi.object(),
  userStorageType: Joi.string()
    .allow(['zookeeper', 'k8sSecret'])
    .default('k8sSecret'),
  userStorageAddr: Joi.string()
    .default(process.env.K8S_APISERVER_URI),
  defaultJsonSchemaServer: Joi.string(),
  subClusters: Joi.string().required(),
  apiGatewayDomainName: Joi.string().required(),
  enableGroupIdCompatibility: Joi.bool().default(true),
}).required();


const {error, value} = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`config error\n${error}`);
}
config = value;

// module exports
module.exports = config;
