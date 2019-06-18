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

import {DockerInfo} from './docker-info';
import {Completion} from './completion';
import {Deployment} from './deployment';
import {ContainerSize} from '../models/container-size';
import {get, isNil, isEmpty} from 'lodash';
import {Port} from './port';
import {keyValueArrayReducer, removeEmptyProperties} from '../utils/utils';

export class JobTaskRole {
  constructor(props) {
    const {name, instances, dockerInfo, ports, commands, completion, deployment, containerSize,
           isContainerSizeEnabled} = props;
    this.name = name || '';
    this.instances = instances || 1;
    this.dockerInfo = dockerInfo || new DockerInfo({});
    this.ports = ports || [];
    this.commands = commands || '';
    this.completion = completion || new Completion({});
    this.deployment = deployment|| new Deployment({});
    this.containerSize = containerSize || new ContainerSize({});
    this.isContainerSizeEnabled = isContainerSizeEnabled || false;
  }

  static fromProtocol(name, taskRoleProtocol, deployments, prerequisites, secrets) {
    const instances = get(taskRoleProtocol, 'instances', 1);
    const completion = get(taskRoleProtocol, 'taskRoleProtocol', {});
    const dockerImage = get(taskRoleProtocol, 'dockerImage');
    const extraContainerOptions = get(taskRoleProtocol, 'extraContainerOptions', {});
    const resourcePerInstance = get(taskRoleProtocol, 'resourcePerInstance', {});
    const commands = get(taskRoleProtocol, 'commands', []);

    const taskDeployment = get(deployments[0], `taskRoles.${name}`, {});
    const dockerInfo = prerequisites.find((prerequisite) => prerequisite.name === dockerImage) || {};
    const ports = isNil(resourcePerInstance.ports) ? [] :
      Object.keys(resourcePerInstance.ports).map((key) => new Port(key, resourcePerInstance.ports[key]));

    const jobTaskRole = new JobTaskRole({
      name: name,
      instances: instances,
      completion: Completion.fromProtocol(completion),
      commands: commands.join('\n'),
      containerSize: ContainerSize.fromProtocol({resourcePerInstance, extraContainerOptions}),
      deployment: Deployment.fromProtocol(taskDeployment),
      dockerInfo: DockerInfo.fromProtocol(dockerInfo, secrets),
      ports: ports,
    });

    if (!ContainerSize.isUseDefaultValue(jobTaskRole.containerSize)) {
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
    const ports = this.ports.map((port) => port.convertToProtocolFormat())
                            .reduce(keyValueArrayReducer, {});
    const resourcePerInstance = removeEmptyProperties({...this.containerSize.getResourcePerInstance(), ports: ports});
    const extraContainerOptions = this.containerSize.getExtraContainerOptions();

    taskRole[this.name] = removeEmptyProperties({
      instances: this.instances,
      completion: this.completion,
      dockerImage: this.dockerInfo.name,
      resourcePerInstance: resourcePerInstance,
      commands: isEmpty(this.commands) ? [] : this.commands.trim().split('\n').map((line)=>(line.trim())),
      extraContainerOptions: extraContainerOptions,
    });

    return taskRole;
  }
}

