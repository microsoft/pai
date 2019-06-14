/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {get, isEmpty, isNil} from 'lodash';
import yaml from 'js-yaml';
import Joi from 'joi-browser';
import {jobProtocolSchema} from '../models/protocol-schema';
import {keyValueArrayReducer, removeEmptyProperties} from '../utils/utils';

export class JobProtocol {
  constructor(props) {
    const {name, jobRetryCount, prerequisites, parameters, taskRoles, deployments,
           description, contributor, secrets, defaults, extras} = props;
    this.protocolVersion = 2;
    this.name = name || '';
    this.description = description || '';
    this.contributor = contributor || '';
    this.type = 'job';
    this.jobRetryCount = jobRetryCount || 0;
    this.prerequisites = prerequisites || [];
    this.parameters = parameters || {};
    this.taskRoles = taskRoles || {};
    this.deployments = deployments || {};
    this.secrets = secrets || {};
    this.defaults = defaults || {};
    this.extras = extras || {};
  }

  static fromYaml(protocolYaml) {
    try {
      const jobProtocol = yaml.safeLoad(protocolYaml);
      // Need to validate the protocol here.
      return new JobProtocol(jobProtocol);
    } catch (e) {
      alert(e.message);
    }
  }

  static validateFromYaml(protocolYaml) {
    try {
      const protocol = yaml.safeLoad(protocolYaml);
      const result = Joi.validate(protocol, jobProtocolSchema);
      return String(result.error || '');
    } catch (err) {
      return String(err.message);
    }
  }

  getUpdatedProtocol(jobBasicInfo, jobTaskRoles, jobParameters) {
    const parameters = jobParameters.map((parameter) => parameter.convertToProtocolFormat())
                                    .reduce(keyValueArrayReducer, {});
    let deployments = this._generateDeployments(jobTaskRoles);
    const delpoyName = get(this, 'defaults.deployment', 'defaultDeployment');
    deployments = isEmpty(deployments) ? [] : [{name: delpoyName, taskRoles: deployments}];

    const dockerMap = this._generateDockerPrerequisitesMap(jobTaskRoles);
    const taskRoles = this._updateAndConvertTaskRoles(jobTaskRoles, dockerMap);

    return new JobProtocol({
      ...this,
      ...jobBasicInfo.convertToProtocolFormat(),
      parameters: parameters,
      taskRoles: taskRoles,
      prerequisites: Array.from(dockerMap.values()),
      deployments: deployments,
    });
  }

  _generateDockerPrerequisitesMap(jobTaskRoles) {
    const dockerMap = new Map();
    const dockerPrerequisites = jobTaskRoles.map((taskRole) => taskRole.getDockerPrerequisite());
    dockerPrerequisites.forEach((dockerPrerequisite, index) => {
      const mapKey = dockerPrerequisite.uri;
      if (dockerMap.has(mapKey)) {
        return;
      }
      // Since prerequisites is small, iterate will not impact the performance
      const oldValue = this.prerequisites.find((prerequisite) => prerequisite.uri === mapKey);
      const name = get(oldValue, 'name', `dockerImage-${index}`);
      dockerPrerequisite['name'] = name;
      dockerMap.set(dockerPrerequisite.uri, {...oldValue, ...dockerPrerequisite});
    });

    return dockerMap;
  }

  _updateAndConvertTaskRoles(jobTaskRoles, dockerMap) {
    const taskRoles = jobTaskRoles.map((taskRole) => {
      const dockerUri = get(taskRole, 'dockerInfo.uri');

      if (!isNil(dockerUri) && dockerMap.has(dockerUri)) {
        taskRole.setDockerImage(dockerMap.get(dockerUri).name);
      }
      return taskRole.convertToProtocolFormat();
    }).reduce(keyValueArrayReducer, {});

    return taskRoles;
  }

  _generateDeployments(jobTaskRoles) {
    const deployments = jobTaskRoles.map((taskRole) => {
      const deployment = {};
      deployment[taskRole.name] = taskRole.getDeployment();
      return deployment;
    }).reduce(keyValueArrayReducer, {});
    return removeEmptyProperties(deployments);
  }

  toYaml() {
    try {
      return yaml.safeDump(removeEmptyProperties(this));
    } catch (e) {
      alert(e.message);
    }
  }
}
