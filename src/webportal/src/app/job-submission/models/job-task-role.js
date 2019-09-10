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

import { DockerInfo } from './docker-info';
import { Completion } from './completion';
import { Deployment } from './deployment';
import {
  getDefaultContainerSize,
  isDefaultContainerSize,
} from '../models/container-size';
import { get, isNil, isEmpty } from 'lodash';
import { removeEmptyProperties } from '../utils/utils';
import { DEFAULT_DOCKER_URI } from '../utils/constants';

export class JobTaskRole {
  constructor(props) {
    const {
      name,
      instances,
      dockerInfo,
      ports,
      commands,
      completion,
      deployment,
      containerSize,
      isContainerSizeEnabled,
      taskRetryCount,
      extraOptions,
    } = props;
    this.name = name || '';
    this.instances = instances || 1;
    this.dockerInfo = dockerInfo || new DockerInfo({ uri: DEFAULT_DOCKER_URI });
    this.ports = ports || [];
    this.commands = commands || '';
    this.completion = completion || new Completion({});
    this.deployment = deployment || new Deployment({});
    this.containerSize = containerSize || getDefaultContainerSize();
    this.isContainerSizeEnabled = isContainerSizeEnabled || false;
    this.taskRetryCount = taskRetryCount || 0;
    this.extraOptions = extraOptions || {};
  }

  static fromProtocol(
    name,
    taskRoleProtocol,
    deployments,
    prerequisites,
    secrets,
  ) {
    const instances = get(taskRoleProtocol, 'instances', 1);
    const completion = get(taskRoleProtocol, 'completion', {});
    const dockerImage = get(taskRoleProtocol, 'dockerImage');
    const resourcePerInstance = get(
      taskRoleProtocol,
      'resourcePerInstance',
      {},
    );
    const commands = get(taskRoleProtocol, 'commands', []);

    const taskDeployment = get(deployments[0], `taskRoles.${name}`, {});
    const dockerInfo =
      prerequisites.find(
        prerequisite =>
          prerequisite.name === dockerImage &&
          prerequisite.type === 'dockerimage',
      ) || {};
    const ports = isNil(resourcePerInstance.ports)
      ? []
      : Object.entries(resourcePerInstance.ports).map(([key, value]) => ({
          key,
          value: value.toString(),
        }));
    const taskRetryCount = get(taskRoleProtocol, 'taskRetryCount', 0);
    const extraOptions = removeEmptyProperties({
      data: get(taskRoleProtocol, 'data'),
      output: get(taskRoleProtocol, 'output'),
      script: get(taskRoleProtocol, 'script'),
      shmMB: get(taskRoleProtocol, 'extraContainerOptions.shmMB'),
    });

    const jobTaskRole = new JobTaskRole({
      name: name,
      instances: instances,
      completion: Completion.fromProtocol(completion),
      commands: isNil(commands) ? '' : commands.join('\n'),
      containerSize: resourcePerInstance,
      deployment: Deployment.fromProtocol(taskDeployment),
      dockerInfo: DockerInfo.fromProtocol(dockerInfo, secrets),
      ports: ports,
      taskRetryCount: taskRetryCount,
      extraOptions,
    });

    if (!isDefaultContainerSize(jobTaskRole.containerSize)) {
      jobTaskRole.isContainerSizeEnabled = true;
    }
    return jobTaskRole;
  }

  getDockerPrerequisite() {
    return this.dockerInfo.convertToProtocolFormat();
  }

  getDeployment() {
    return this.deployment.convertToProtocolFormat();
  }

  convertToProtocolFormat() {
    const taskRole = {};
    const ports = this.ports.reduce((val, x) => {
      if (typeof x.value === 'string') {
        val[x.key] = parseInt(x.value);
      } else {
        val[x.key] = x.value;
      }
      return val;
    }, {});
    const resourcePerInstance = removeEmptyProperties({
      ...this.containerSize,
      ports: ports,
    });

    taskRole[this.name] = removeEmptyProperties({
      instances: this.instances,
      completion: this.completion,
      taskRetryCount: this.taskRetryCount,
      dockerImage: this.dockerInfo.name,
      data: this.extraOptions.data,
      output: this.extraOptions.output,
      script: this.extraOptions.script,
      extraContainerOptions: removeEmptyProperties({
        shmMB: this.extraOptions.shmMB,
      }),
      resourcePerInstance: resourcePerInstance,
      commands: isEmpty(this.commands)
        ? []
        : this.commands
            .trim()
            .split('\n')
            .map(line => line.trim()),
    });

    return taskRole;
  }
}
