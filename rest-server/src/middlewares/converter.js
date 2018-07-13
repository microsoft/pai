// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the 'Software'), to deal in the Software without restriction, including without limitation
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
const logger = require('../config/logger');

const getCommands = (element, path) => {
    let items = element.uri.split(',');
    let res = ['mkdir ' + path];
    if (items.length > 1) {
      res.push('mkdir ' + path + '/' + element.name);
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
        res.push('mv ' + uriname + ' ' + path + '/' + element.name);
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
        res.push('mv ' + uriname + ' ' + path + '/' + element.name);
      }
    }
    return res;
};

const parseParameter = (value) => {
    let v = JSON.stringify(value);
    let reg = new RegExp('\\$[A-Za-z0-9\\.\\_]+', 'g');
    let newv = v;
    let result = reg.exec(v);
    while (result != null) {
      if (!result[0].startsWith('$PAI')) {
        let paths = result[0].substring(1).split('.');
        let val = value;
        for (let i = 0; i < paths.length && val != undefined; i++) {
          if (paths[i] in val) {
            val = val[paths[i]];
          } else {
            val = val.filter((element) => element.name == paths[i]).pop();
          }
        }
        if (val != undefined) {
          if (typeof val == 'string') {
            newv = newv.replace(result[0], val.toString());
          } else {
            if (v[reg.lastIndex - result[0].length - 1] == '"') {
              result[0] = '"' + result[0] + '"';
            }
            newv = newv.replace(result[0], val.toString());
          }
        }
      }
      result = reg.exec(v);
    }
    return JSON.parse(newv);
};

/**
 * Convert new config to old config.
 */
const convert = (schema) => {
    return (req, res, next) => {
      req.body = parseParameter(req.body);
      // logger.info(req.body);
      Joi.validate(req.body, schema, (err, value) => {
        if (err) {
          const errorType = 'ParameterValidationError';
          const errorMessage = 'Could not validate request data.\n' + err.stack;
          logger.warn('[%s] %s', errorType, errorMessage);
          return res.status(500).json({
            error: errorType,
            message: errorMessage,
          });
        } else {
          let prerequisitesMap = {};
          value.prerequisites.forEach((element) => {
            prerequisitesMap[element.type] = {};
            prerequisitesMap[element.type][element.name] = element;
          });
          let newbody = {};
          newbody.jobName = value.job.name;
          newbody.image = prerequisitesMap.dockerimage[Object.keys(prerequisitesMap.dockerimage)[0]].uri;
          let dataDir = 'data';
          let codeDir = 'code';
          newbody.outputDir = '$PAI_DEFAULT_FS_URI/marketplace';
          newbody.killAllOnCompletedTaskNumber = value.job.parameters.killAllOnCompletedTaskNumber ? value.job.parameters.killAllOnCompletedTaskNumber: 1;
          newbody.gpuType = value.job.parameters.gpuType ? value.job.parameters.gpuType: '';
          newbody.virtualCluster = value.job.parameters.virtualCluster ? value.job.parameters.virtualCluster: 'default';
          newbody.retryCount = value.job.parameters.retryCount ? value.job.parameters.retryCount: 0;
          newbody.taskRoles = [];

          value.job.tasks.forEach((task) => {
            let commands = [];
            if (task.data) {
              commands = commands.concat(getCommands(prerequisitesMap['data'][task.data], dataDir));
              for (let i = 0; i < task.command.length; i++) {
                task.command[i] = task.command[i].replace(task.data, dataDir + '/' + task.data);
              }
            }
            if (task.script) {
              commands = commands.concat(getCommands(prerequisitesMap['script'][task.script], codeDir));
              for (let i = 0; i < task.command.length; i++) {
                task.command[i] = task.command[i].replace(task.script, codeDir + '/' + task.script);
              }
            }
            commands.push('export CURRENT_DIR=`pwd`');
            Object.keys(task.env).forEach((env) => {
              if (task.env[env].indexOf(task.script) >= 0) {
                task.env[env] = task.env[env].replace(task.script, '$CURRENT_DIR/' + codeDir + '/' + task.script);
              }
              if (task.env[env].indexOf(task.data) >= 0) {
                task.env[env] = task.env[env].replace(task.data, '$CURRENT_DIR/' + dataDir + '/' + task.data);
              }
              commands.push('export ' + env + '=' + task.env[env]);
            });
            commands = commands.concat(task.command).join(';');
            let taskRole = {name: task.name,
                            taskNumber: task.resource.instances,
                            cpuNumber: task.resource.resourcePerInstance.cpu,
                            memoryMB: task.resource.resourcePerInstance.memoryMB,
                            gpuNumber: task.resource.resourcePerInstance.gpu,
                            command: commands,
            };
            if ('portList' in task.resource.resourcePerInstance) {
              taskRole.portList = task.resource.resourcePerInstance.portList;
            }
            newbody.taskRoles.push(taskRole);
          });
          req.body = newbody;
          next();
        }
      });
    };
  };

// module exports
module.exports = {convert};
