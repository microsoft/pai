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
const async = require('async');
const yaml = require('js-yaml');

const param = require('./parameter');
const jobConfig = require('../config/job');
const jobConfigV2 = require('../config/jobV2');
const createError = require('../util/error');
const logger = require('../config/logger');
const launcherConfig = require('../config/launcher');
const Hdfs = require('../util/hdfs');

const checkMinTaskNumber = (req, res, next) => {
  logger.info('check:');
  logger.info(req.body);
  if ('killAllOnCompletedTaskNumber' in req.body) {
    const errorMessage = 'killAllOnCompletedTaskNumber has been obsoleted, please use minFailedTaskCount and minSucceededTaskCount instead.';
    next(createError('Bad Request', 'InvalidParametersError', errorMessage));
  }
  for (let i = 0; i < req.body.taskRoles.length; i ++) {
    const taskNumber = req.body.taskRoles[i].taskNumber;
    const minFailedTaskCount = req.body.taskRoles[i].minFailedTaskCount || 0;
    const minSucceededTaskCount = req.body.taskRoles[i].minSucceededTaskCount || 0;
    if (minFailedTaskCount > taskNumber || minSucceededTaskCount > taskNumber) {
      const errorMessage = 'minFailedTaskCount or minSucceededTaskCount should not be greater than tasks number.';
      next(createError('Bad Request', 'InvalidParametersError', errorMessage));
    }
  }
  next();
};

const getCommands = (element) => {
  let items = element.uri.split(',');
  let res = [];
  if (items.length > 1) {
    res.push('mkdir ' + element.name);
  }
  for (let i = 0; i < items.length; i++) {
    let uriname = items[i].substring(items[i].lastIndexOf('/') + 1);
    if (items[i].indexOf('github') >= 0) {
      let uris = items[i].split('@');
      res.push('git clone ' + uris[0]);
      if (uris.length > 1) {
        uriname = uriname.substring(0, uriname.length - uris[1].length - 1);
        res.push('cd ' + uriname + '; git checkout ' + uris[1] + '; cd ..');
      }
      res.push('mv ' + uriname + ' ' + element.name);
    } else if (element.uri.indexOf('http') == 0) {
      res.push('wget ' + items[i]);
      if (uriname.indexOf('.gz') >= 0) {
        res.push('gunzip ' + uriname);
        uriname = uriname.substring(0, uriname.length - 3);
      }
      if (uriname.indexOf('.tar') >= 0) {
        res.push('mkdir ' + element.name);
        res.push('tar xvf ' + uriname + ' -C ' + element.name + ' --strip-components 1');
        uriname = element.name;
      }
      if (uriname.indexOf('.zip') >= 0) {
        res.push('unzip ' + uriname);
        uriname = uriname.substring(0, uriname.elgnth - 4);
      }
      res.push('mv ' + uriname + ' ' + element.name);
    }
  }
  return res;
};

const saveYamlToHDFS = (req) => {
  let namespace = req.user.username;
  let jobname = req.body.name;
  jobname = `${namespace}~${jobname}`;
  const hdfs = new Hdfs(launcherConfig.webhdfsUri);
  async.parallel([
    (parallelCallback) => {
      let jobConfigYaml = launcherConfig.jobConfigFileName.replace('json', 'yaml');
      hdfs.createFile(
        `/Container/${req.user.username}/${jobname}/${jobConfigYaml}`,
        yaml.safeDump(req.body),
        {'user.name': req.user.username, 'permission': '644', 'overwrite': 'true'},
        (error, result) => {
          parallelCallback(error);
        }
      );
    },
  ]);
};

const replaceParameters = (str, param) => {
  if (typeof str != 'string') return str;
  let newstr = str;
  let reg = new RegExp('\\$\\$[A-Za-z0-9\\.\\_]+\\$\\$', 'g');
  let result = reg.exec(str);
  while (result != null) {
    let variable = result[0].substring(2, result[0].length - 2);
    if (variable in param) {
      if (newstr == result[0]) {
        newstr = param[variable];
      } else {
        newstr = newstr.replace(result[0], param[variable].toString());
      }
    }
    result = reg.exec(str);
  }
  return newstr;
};

const parseParameters = (req, res, next) => {
  saveYamlToHDFS(req);
  let queue = [[req.body, req.body['parameters']]];
  while (queue.length > 0) {
    let item = queue.shift();
    let obj = item[0];
    let param = item[1];
    if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] == 'object') {
          queue.push([obj[i], param]);
        } else {
          obj[i] = replaceParameters(obj[i], param);
        }
      }
    } else if (obj instanceof Object) {
      if ('parameters' in obj) {
        Object.keys(obj['parameters']).forEach((key) => {
          obj['parameters'][key] = replaceParameters(obj['parameters'][key], param);
        });
        param = obj['parameters'];
      }
      Object.keys(obj).forEach((key) => {
        if (key != 'prerequisites') {
          if (typeof obj[key] == 'object') {
            queue.push([obj[key], param]);
          } else {
            obj[key] = replaceParameters(obj[key], param);
          }
        }
      });
    }
  }
  next();
};

/**
* Convert new config to old config.
*/
const convert = (req, res, next) => {
  logger.info(req.body);
  let value = req.body;
  let prerequisitesMap = {};
  value.prerequisites.forEach((element) => {
    if (!(element.type in prerequisitesMap)) {
      prerequisitesMap[element.type] = {};
    }
    prerequisitesMap[element.type][element.name] = element;
  });
  let newbody = {};
  newbody.jobName = value.name;
  newbody.image = prerequisitesMap.dockerimage[Object.keys(prerequisitesMap.dockerimage)[0]].uri;
  newbody.outputDir = '$PAI_DEFAULT_FS_URI/marketplace/' + req.user.username;
  newbody.gpuType = value.gpuType;
  newbody.virtualCluster = value.virtualCluster;
  newbody.retryCount = value.retryCount;
  newbody.taskRoles = [];

  value.tasks.forEach((task) => {
    let commands = ['export PAI_CURRENT_DIR=`pwd`'];
    if (task.data != '') {
      commands = commands.concat(getCommands(prerequisitesMap['data'][task.data]));
    }
    if (task.script != '') {
      commands = commands.concat(getCommands(prerequisitesMap['script'][task.script]));
    }
    commands = commands.concat(task.command).join(';');
    let taskRole = {name: task.role,
                    minFailedTaskCount: task.minFailedTaskCount,
                    minSucceededTaskCount: task.minSucceededTaskCount,
                    taskNumber: task.resource.instances,
                    cpuNumber: task.resource.resourcePerInstance.cpu,
                    memoryMB: task.resource.resourcePerInstance.memoryMB,
                    gpuNumber: task.resource.resourcePerInstance.gpu,
                    portList: task.resource.portList,
                    command: commands,
    };
    newbody.taskRoles.push(taskRole);
  });
  req.params.username = req.user.username;
  req.body = newbody;
  next();
};


const submission = [
  parseParameters,
  param.validate(jobConfigV2.schema),
  convert,
  param.validate(jobConfig.schema),
  checkMinTaskNumber,
];

const query = (req, res, next) => {
  const query = {};
  if (req.query.username) {
    query.username = req.query.username;
  }
  req._query = query;
  next();
};

// module exports
module.exports = {submission, query};
