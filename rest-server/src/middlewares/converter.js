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
const logger = require('../config/logger');

const getCommands = (element, path) => {
    var uriname = element.uri.substring(element.uri.lastIndexOf("/") + 1);
    if (element.type.indexOf("github") >= 0) {    
        return ["git clone " + element.uri, "mv " + uriname + " " + path + "/" + element.name];
    } else if (element.uri.indexOf("http") == 0) {
        var res = ["wget " + element.uri];
        if (uriname.indexOf(".gz") >= 0) {
          res.push("gunzip " + uriname);
          uriname = uriname.substring(0, uriname.length - 3);
        }
        if (uriname.indexOf(".tar") >= 0) {
          res.push("tar xvf " + uriname);
          uriname = uriname.substring(0, uriname.length - 4);
        }
        if (uriname.indexOf(".zip") >= 0) {
          res.push("unzip " + uriname);
          uriname = uriname.substring(0, uriname.elgnth - 4);  
        }
        res.push("mv " + uriname + " " + path + "/" + element.name);
        return res;
    }
    return [];
};

const getParameter = (v, value) => {
    var idx = v.toString().indexOf("$");
    while (idx >= 0) {
      if (v.substring(idx + 1, idx + 4) != 'PAI') {
          var sepidx = v.indexOf(' ', idx);
          if (sepidx <= 0) sepidx = v.length;
          var items = v.substring(idx + 1, sepidx).split('.');
          var val = value;
          for (item in items) {
            if (val.item) {
              val = val.item;
            } else {
              val = v.substring(idx, sepidx);
            }
          }
          v = v.substring(0, idx) + val.toString() + v.substring(sepidx);
      } 
      idx = v.indexOf("$", idx + 1);
    }
    return v;
}
/**
 * Convert new config to old config.
 */
const convert = (schema) => {
    return (req, res, next) => {
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
          var prerequisitesMap = {};
          for (var element in value.prerequisites) {
            prerequisitesMap[element.type] = {};
            prerequisitesMap[element.type][element.name] = element;
          };
          var newbody = {};
          newbody.jobName = value.job.jobName;
          newbody.image = prerequisitesMap.dockerimage[Object.keys(prerequisitesMap.dockerimage)[0]].uri;
          newbody.dataDir = "$PAI_DEFAULT_FS_URI/path/data";
          newbody.outputDir = "$PAI_DEFAULT_FS_URI/path/output";
          newbody.codeDir = "$PAI_DEFAULT_FS_URI/path/code";
          newbody.killAllOnCompletedTaskNumber = value.job.parameters.killAllOnCompletedTaskNumber;
          newbody.gpuType = value.job.parameters.gpuType;
          newbody.virtualCluster = value.job.parameters.virtualCluster;
          newbody.retryCount = value.job.parameters.retryCount;
          newbody.taskRoles = [];

          for (task in value.job.tasks) {
              var commands = [];
              if (task.data) {
                  commands += getCommands(prerequisitesMapp['data'][task.data], newbody.dataDir);
                  task.data = newbody.dataDir + '/' + task.data;
              }
              if (task.script) {
                  commands += getCommands(prerequisitesMap['script'][task.script], newbody.codeDir);
                  task.script = newbody.codeDir + '/' + task.script;
              }
              commands += getParameter(task.command, value);
              newbody.taskRoles.push({name: task.name, 
                taskNumber: getParameter(task.resource.instances, value), 
                cpuNumber: getParameter(task.resource.resourcePerInstance.cpu, value), 
                memoryMB: getParameter(task.resource.resourcePerInstance.memoryMB, value),
                gpuNumber: getParameter(task.resource.resourcePerInstance.gpu, value),
                portList: getParameter(task.resource.resourcePerInstance.portList, value), 
                command: commands.join(';')});
          }
          console.log(newbody);
          req.body = newbody;
          next();
        }
      });
    };
  };
  

// module exports
module.exports = {convert};