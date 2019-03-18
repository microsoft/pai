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
const yaml = require('js-yaml');
const mustache = require('mustache');
const createError = require('../../util/error');
const protocolSchema = require('../../config/v2/protocol');


const prerequisiteTypes = [
  'script',
  'output',
  'data',
  'dockerimage',
];

const prerequisiteFields = [
  'script',
  'output',
  'data',
  'dockerImage',
];

const protocolWrap = async (req, res, next) => {
  const protocolYAML = req.body;
  req.rawBody = protocolYAML;
  req.body = {
    protocol: protocolYAML,
  };
  await next();
};

const protocolValidate = async (req, res, next) => {
  const protocolYAML = req.body.protocol;
  const protocolJSON = yaml.safeLoad(protocolYAML);
  if (!protocolSchema.validate(protocolJSON)) {
    throw createError('Bad Request', 'InvalidProtocolError', protocolSchema.validate.errors);
  }
  // convert prerequisites list to dict
  const prerequisites = {};
  for (let type of prerequisiteTypes) {
    prerequisites[type] = {};
  }
  if ('prerequisites' in protocolJSON) {
    for (let item of protocolJSON.prerequisites) {
      prerequisites[item.type][item.name] = item;
    }
  }
  protocolJSON.prerequisites = prerequisites;
  // convert deployments list to dict
  const deployments = {};
  if ('deployments' in protocolJSON) {
    for (let item of protocolJSON.deployments) {
      deployments[item.name] = item;
    }
  }
  protocolJSON.deployments = deployments;
  // check prerequisites in taskRoles
  for (let taskRole of Object.keys(protocolJSON.taskRoles)) {
    for (let field of prerequisiteFields) {
      if (field in protocolJSON.taskRoles[taskRole] &&
        !(protocolJSON.taskRoles[taskRole][field] in prerequisites[field.toLowerCase()])) {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Prerequisite ${protocolJSON.taskRoles[taskRole][field]} does not exist.`
        );
      }
    }
  }
  // check deployment in defaults
  if ('defaults' in protocolJSON) {
    if ('deployment' in protocolJSON.defaults &&
      !(protocolJSON.defaults.deployment in deployments)) {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Default deployment ${protocolJSON.defaults.deployment} does not exist.`
        );
    }
  }
  req.body.protocol = protocolJSON;
  await next();
};

const protocolRender = async (req, res, next) => {
  const protocolJSON = req.body.protocol;
  let deployment = null;
  if ('defaults' in protocolJSON && 'deployment' in protocolJSON.defaults) {
    deployment = protocolJSON.deployments[protocolJSON.defaults.deployment];
  }
  for (let taskRole of Object.keys(protocolJSON.taskRoles)) {
    let commands = protocolJSON.taskRoles[taskRole].commands;
    if (deployment != null && taskRole in deployment.taskRoles) {
      if ('preCommands' in deployment.taskRoles[taskRole]) {
        commands = deployment.taskRoles[taskRole].preCommands.concat(commands);
      }
      if ('postCommands' in deployment.taskRoles[taskRole]) {
        commands = commands.concat(deployment.taskRoles[taskRole].postCommands);
      }
    }
    let entrypoint = '';
    commands = commands.map((command) => command.trim()).join(' ; ');
    const tokens = mustache.parse(commands, ['<%', '%>']);
    const context = new mustache.Context({
      '$parameters': protocolJSON.parameters,
      '$script': protocolJSON.prerequisites['script'][protocolJSON.taskRoles[taskRole].script],
      '$output': protocolJSON.prerequisites['output'][protocolJSON.taskRoles[taskRole].output],
      '$data': protocolJSON.prerequisites['data'][protocolJSON.taskRoles[taskRole].data],
    });
    for (let token of tokens) {
      const symbol = token[0];
      let tokenStr = token[1];
      if (symbol === 'text') {
        entrypoint += tokenStr;
      } else if (symbol === 'name') {
        tokenStr = tokenStr.replace(/\[(\d+)\]/g, '.$1');
        const value = context.lookup(tokenStr);
        if (value != null) {
          entrypoint += value;
        }
      }
    }
    protocolJSON.taskRoles[taskRole].entrypoint = entrypoint.trim();
  }
  req.body.protocol = protocolJSON;
  await next();
};

const protocolSubmit = [
  protocolValidate,
  protocolRender,
];


// module exports
module.exports = {
  wrap: protocolWrap,
  validate: protocolValidate,
  render: protocolRender,
  submit: protocolSubmit,
};
