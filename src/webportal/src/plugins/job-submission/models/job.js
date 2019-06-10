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

import {get, isNil} from 'lodash';
import yaml from 'js-yaml';

export class Job {
  constructor(jobBasicInfo, jobTaskRoles, jobParameters) {
    this.jobBasicInfo = jobBasicInfo;
    this.jobTaskRoles = jobTaskRoles;
    this.jobParameters = jobParameters;
  }

  _initJob() {
  }

  _validateJobProperties() {
  }

  convertToProtocolFormat() {
    const parameters = this.jobParameters.map((parameter) => parameter.convertToProtocolFormat());
    const delpoyments = this.jobTaskRoles.map((taskRole) => taskRole.getDeployment());

    const dockerMap = new Map();
    const dockerPrerequisites = this.jobTaskRoles.map((taskRole) => taskRole.getDockerPrerequisite());
    dockerPrerequisites.forEach((dockerPrerequisite, index) => {
      const mapKey = dockerPrerequisite.uri;
      if (dockerMap.has(mapKey)) {
        return;
      }
      dockerPrerequisite['name'] = 'dockerImage-' + index;
      dockerMap.set(dockerPrerequisite.uri, dockerPrerequisite);
    });

    const prerequisites = Array.from(dockerMap.values());
    const taskRoels = this.jobTaskRoles.map((taskRole) => {
      const dockerUri = get(taskRole, 'dockerInfo.uri');
      if (!isNil(dockerUri) && dockerMap.has(dockerUri)) {
        taskRole.setDockerImage(dockerMap.get(dockerUri).name);
      }
      return taskRole.convertToProtocolFormat();
    });

    const jobProtocol = {
      ...this.jobBasicInfo.convertToProtocolFormat(),
      parameters: parameters,
      taskRoels: taskRoels,
      prerequisites: prerequisites,
      delpoyments: delpoyments,
    };
    return jobProtocol;
  }

  generateYaml() {
    try {
      const protocolFormat = yaml.safeLoad(JSON.stringify(this.convertToProtocolFormat()));
      return yaml.safeDump(protocolFormat);
    } catch (e) {
      alert(e.message);
    }
  }

  submit() {
  }
}
