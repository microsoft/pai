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


// skip guard-for-in becasue protocolValidate has already filtered keys
/* eslint guard-for-in: 0 */

// module dependencies
const yaml = require('js-yaml');
const template = require('lodash.template');
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

const protocolValidate = async (ctx, next) => {
    // TODO
    const protocolYAML = ctx.body;
    const protocolJSON = yaml.safeLoad(protocolYAML);
    if (!protocolSchema.validate(protocolJSON)) {
        throw new Error(protocolSchema.validate.errors);
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
    for (let taskRole in protocolJSON.taskRoles) {
        for (let field of prerequisiteFields) {
            if (field in protocolJSON.taskRoles[taskRole] &&
                !(protocolJSON.taskRoles[taskRole][field] in prerequisites[field.toLowerCase()])) {
                throw new Error('prerequisite does not exist');
            }
        }
    }
    // check deployment in defaults
    if ('defaults' in protocolJSON) {
        if ('deployment' in protocolJSON.defaults &&
            !(protocolJSON.defaults.deployment in deployments)) {
            throw new Error('default deployment does not exist');
        }
    }
    await next();
};

const protocolRender = async (ctx, next) => {
    const protocolJSON = ctx.body;
    for (let taskRole in protocolJSON.taskRoles) {
        let commands = protocolJSON.taskRoles[taskRole].commands;
        if (taskRole in protocolJSON.deployments) {
            if ('preCommands' in protocolJSON.deployments[taskRole]) {
                commands = protocolJSON.deployments[taskRole].preCommands.concat(commands);
            }
            if ('postCommands' in protocolJSON.deployments[taskRole]) {
                commands = commands.concat(protocolJSON.deployments[taskRole].postCommands);
            }
        }
        let entrypoint = commands.join(' ; ').replace('<%', '<%=');
        const compiled = template(entrypoint);
        entrypoint = compiled({
            '$parameters': protocolJSON.parameters,
            '$script': protocolJSON.prerequisites['script'][taskRole],
            '$output': protocolJSON.prerequisites['output'][taskRole],
            '$data': protocolJSON.prerequisites['data'][taskRole],
        });
        protocolJSON[taskRole].entrypoint = entrypoint;
    }
    await next();
};

const submission = [
    protocolValidate,
    protocolRender,
];

// module exports
module.exports = {submission};
