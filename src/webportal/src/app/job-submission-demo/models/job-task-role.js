// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { get, isEmpty, isNil } from 'lodash';
import { Completion } from './completion';

export class JobTaskRole {
  constructor(props) {
    const {
      name,
      dockerImage,
      instances,
      commands,
      ports,
      taskRetryCount,
      completion,
      skuType,
      skuNum,
    } = props;
    this.name = name || '';
    this.instances = instances || 1;
    this.dockerImage = dockerImage || 'docker_image_0';
    this.commands = commands || '';
    this.ports = ports;
    this.taskRetryCount = taskRetryCount || 0;
    this.completion = completion || new Completion({});
    this.skuNum = skuNum || 1;
    this.skuType = skuType || null;
  }

  static fromProtocol(protocol, currentKey) {
    const taskRoleProtocol = get(protocol, `taskRoles.${currentKey}`, {});
    const extraProtocol = get(
      protocol,
      `extras.hivedScheduler.taskRoles.${currentKey}`,
      {},
    );
    const instances = get(taskRoleProtocol, 'instances', 1);
    const dockerImage = get(taskRoleProtocol, 'dockerImage');
    const commands = get(taskRoleProtocol, 'commands', []);

    const taskRetryCount = get(taskRoleProtocol, 'taskRetryCount', 0);
    const completion = get(taskRoleProtocol, 'completion', {});

    const skuNum = get(extraProtocol, 'skuNum', 1);
    const skuType = get(extraProtocol, 'skuType', null);

    const jobTaskRole = new JobTaskRole({
      name: currentKey,
      instances: instances,
      dockerImage: dockerImage,
      commands: isNil(commands) ? '' : commands.join('\n'),
      taskRetryCount: taskRetryCount,
      completion: Completion.fromProtocol(completion),
      skuNum: skuNum,
      skuType: skuType,
    });

    return jobTaskRole;
  }

  convertToProtocolFormat() {
    const taskRole = {
      instances: this.instances,
      dockerImage: this.dockerImage,
      commands: isEmpty(this.commands)
        ? []
        : this.commands.split('\n').map(line => line.trim()),
      taskRetryCount: this.taskRetryCount,
      completion: this.completion,
    };
    const hivedTaskRole = {
      skuNum: this.skuNum,
      skuType: this.skuType,
    };
    return [taskRole, hivedTaskRole];
  }
}
